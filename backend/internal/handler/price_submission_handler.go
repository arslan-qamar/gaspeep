package handler

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PriceSubmissionHandler handles price submission endpoints
type PriceSubmissionHandler struct {
	db *sql.DB
}

// NewPriceSubmissionHandler creates a new PriceSubmissionHandler
func NewPriceSubmissionHandler(db *sql.DB) *PriceSubmissionHandler {
	return &PriceSubmissionHandler{db: db}
}

// CreatePriceSubmission handles POST /api/price-submissions
// Allows authenticated users to submit a new fuel price for a station
func (h *PriceSubmissionHandler) CreatePriceSubmission(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		StationID        string  `json:"stationId" binding:"required"`
		FuelTypeID       string  `json:"fuelTypeId" binding:"required"`
		Price            float64 `json:"price" binding:"required,gt=0"`
		SubmissionMethod string  `json:"submissionMethod" binding:"required,oneof=text voice photo"`
		PhotoURL         string  `json:"photoUrl"`
		VoiceRecordingURL string `json:"voiceRecordingUrl"`
		OCRData          string  `json:"ocrData"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that station exists
	var stationExists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM stations WHERE id = $1)", req.StationID).Scan(&stationExists)
	if err != nil || !stationExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "station not found"})
		return
	}

	// Validate that fuel type exists
	var fuelTypeExists bool
	err = h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM fuel_types WHERE id = $1)", req.FuelTypeID).Scan(&fuelTypeExists)
	if err != nil || !fuelTypeExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fuel type not found"})
		return
	}

	id := uuid.New().String()

	// Calculate initial verification confidence based on submission method
	// Photo submissions get higher confidence due to OCR verification potential
	var confidence float64
	switch req.SubmissionMethod {
	case "photo":
		confidence = 0.8
	case "text":
		confidence = 0.5
	case "voice":
		confidence = 0.4
	}

	query := `
		INSERT INTO price_submissions (
			id, user_id, station_id, fuel_type_id, price, 
			submission_method, submitted_at, moderation_status, 
			verification_confidence, photo_url, voice_recording_url, ocr_data
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, user_id, station_id, fuel_type_id, price, 
			submission_method, submitted_at, moderation_status, 
			verification_confidence, photo_url, voice_recording_url, ocr_data`

	var submission struct {
		ID                     string    `json:"id"`
		UserID                 string    `json:"userId"`
		StationID              string    `json:"stationId"`
		FuelTypeID             string    `json:"fuelTypeId"`
		Price                  float64   `json:"price"`
		SubmissionMethod       string    `json:"submissionMethod"`
		SubmittedAt            time.Time `json:"submittedAt"`
		ModerationStatus       string    `json:"moderationStatus"`
		VerificationConfidence float64   `json:"verificationConfidence"`
		PhotoURL               *string   `json:"photoUrl"`
		VoiceRecordingURL      *string   `json:"voiceRecordingUrl"`
		OCRData                *string   `json:"ocrData"`
	}

	err = h.db.QueryRow(
		query,
		id, userID.(string), req.StationID, req.FuelTypeID, req.Price,
		req.SubmissionMethod, time.Now(), "pending",
		confidence, nilIfEmpty(req.PhotoURL), nilIfEmpty(req.VoiceRecordingURL), nilIfEmpty(req.OCRData),
	).Scan(
		&submission.ID, &submission.UserID, &submission.StationID, &submission.FuelTypeID,
		&submission.Price, &submission.SubmissionMethod, &submission.SubmittedAt,
		&submission.ModerationStatus, &submission.VerificationConfidence,
		&submission.PhotoURL, &submission.VoiceRecordingURL, &submission.OCRData,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create price submission"})
		return
	}

	// Auto-approve high-confidence submissions and update the fuel_prices table
	if confidence >= 0.5 {
		h.autoApproveSubmission(submission.ID, req.StationID, req.FuelTypeID, req.Price)
	}

	c.JSON(http.StatusCreated, submission)
}

// GetMySubmissions handles GET /api/price-submissions/my-submissions
// Returns the authenticated user's price submissions with pagination
func (h *PriceSubmissionHandler) GetMySubmissions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := `
		SELECT ps.id, ps.user_id, ps.station_id, ps.fuel_type_id, ps.price,
			ps.submission_method, ps.submitted_at, ps.moderation_status,
			ps.verification_confidence, ps.photo_url, ps.voice_recording_url, ps.ocr_data,
			ps.moderator_notes,
			s.name as station_name, s.brand as station_brand,
			ft.display_name as fuel_type_name
		FROM price_submissions ps
		INNER JOIN stations s ON ps.station_id = s.id
		INNER JOIN fuel_types ft ON ps.fuel_type_id = ft.id
		WHERE ps.user_id = $1
		ORDER BY ps.submitted_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := h.db.Query(query, userID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch submissions"})
		return
	}
	defer rows.Close()

	submissions := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, uid, stationID, fuelTypeID, method, status string
			stationName, stationBrand, fuelTypeName        string
			price, confidence                              float64
			submittedAt                                    time.Time
			photoURL, voiceURL, ocrData, moderatorNotes    sql.NullString
		)

		if err := rows.Scan(
			&id, &uid, &stationID, &fuelTypeID, &price,
			&method, &submittedAt, &status,
			&confidence, &photoURL, &voiceURL, &ocrData,
			&moderatorNotes,
			&stationName, &stationBrand, &fuelTypeName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan submission"})
			return
		}

		sub := map[string]interface{}{
			"id":                     id,
			"userId":                 uid,
			"stationId":              stationID,
			"fuelTypeId":             fuelTypeID,
			"price":                  price,
			"submissionMethod":       method,
			"submittedAt":            submittedAt,
			"moderationStatus":       status,
			"verificationConfidence": confidence,
			"stationName":            stationName,
			"stationBrand":           stationBrand,
			"fuelTypeName":           fuelTypeName,
		}

		if photoURL.Valid {
			sub["photoUrl"] = photoURL.String
		}
		if voiceURL.Valid {
			sub["voiceRecordingUrl"] = voiceURL.String
		}
		if ocrData.Valid {
			sub["ocrData"] = ocrData.String
		}
		if moderatorNotes.Valid {
			sub["moderatorNotes"] = moderatorNotes.String
		}

		submissions = append(submissions, sub)
	}

	// Get total count for pagination
	var total int
	h.db.QueryRow("SELECT COUNT(*) FROM price_submissions WHERE user_id = $1", userID.(string)).Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"submissions": submissions,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetModerationQueue handles GET /api/moderation-queue
// Returns pending price submissions for moderators to review
func (h *PriceSubmissionHandler) GetModerationQueue(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := `
		SELECT ps.id, ps.user_id, ps.station_id, ps.fuel_type_id, ps.price,
			ps.submission_method, ps.submitted_at, ps.moderation_status,
			ps.verification_confidence, ps.photo_url, ps.voice_recording_url, ps.ocr_data,
			ps.moderator_notes,
			s.name as station_name, s.brand as station_brand,
			ft.display_name as fuel_type_name,
			u.display_name as user_display_name
		FROM price_submissions ps
		INNER JOIN stations s ON ps.station_id = s.id
		INNER JOIN fuel_types ft ON ps.fuel_type_id = ft.id
		INNER JOIN users u ON ps.user_id = u.id
		WHERE ps.moderation_status = $1
		ORDER BY ps.submitted_at ASC
		LIMIT $2 OFFSET $3`

	rows, err := h.db.Query(query, status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch moderation queue"})
		return
	}
	defer rows.Close()

	submissions := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, uid, stationID, fuelTypeID, method, modStatus string
			stationName, stationBrand, fuelTypeName, userName string
			price, confidence                                 float64
			submittedAt                                       time.Time
			photoURL, voiceURL, ocrData, moderatorNotes       sql.NullString
		)

		if err := rows.Scan(
			&id, &uid, &stationID, &fuelTypeID, &price,
			&method, &submittedAt, &modStatus,
			&confidence, &photoURL, &voiceURL, &ocrData,
			&moderatorNotes,
			&stationName, &stationBrand, &fuelTypeName, &userName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan submission"})
			return
		}

		sub := map[string]interface{}{
			"id":                     id,
			"userId":                 uid,
			"stationId":              stationID,
			"fuelTypeId":             fuelTypeID,
			"price":                  price,
			"submissionMethod":       method,
			"submittedAt":            submittedAt,
			"moderationStatus":       modStatus,
			"verificationConfidence": confidence,
			"stationName":            stationName,
			"stationBrand":           stationBrand,
			"fuelTypeName":           fuelTypeName,
			"userDisplayName":        userName,
		}

		if photoURL.Valid {
			sub["photoUrl"] = photoURL.String
		}
		if voiceURL.Valid {
			sub["voiceRecordingUrl"] = voiceURL.String
		}
		if ocrData.Valid {
			sub["ocrData"] = ocrData.String
		}
		if moderatorNotes.Valid {
			sub["moderatorNotes"] = moderatorNotes.String
		}

		submissions = append(submissions, sub)
	}

	var total int
	h.db.QueryRow("SELECT COUNT(*) FROM price_submissions WHERE moderation_status = $1", status).Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"submissions": submissions,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// ModerateSubmission handles PUT /api/price-submissions/:id/moderate
// Allows moderators to approve or reject a price submission
func (h *PriceSubmissionHandler) ModerateSubmission(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status         string `json:"status" binding:"required,oneof=approved rejected"`
		ModeratorNotes string `json:"moderatorNotes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the submission details before updating
	var stationID, fuelTypeID string
	var price float64
	err := h.db.QueryRow(
		"SELECT station_id, fuel_type_id, price FROM price_submissions WHERE id = $1",
		id,
	).Scan(&stationID, &fuelTypeID, &price)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch submission"})
		return
	}

	// Update moderation status
	result, err := h.db.Exec(
		`UPDATE price_submissions 
		 SET moderation_status = $1, moderator_notes = $2, updated_at = NOW() 
		 WHERE id = $3`,
		req.Status, req.ModeratorNotes, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update submission"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}

	// If approved, update the fuel_prices table
	if req.Status == "approved" {
		h.updateFuelPrice(stationID, fuelTypeID, price)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "submission " + req.Status,
		"id":      id,
	})
}

// autoApproveSubmission auto-approves a submission and updates fuel prices
func (h *PriceSubmissionHandler) autoApproveSubmission(submissionID, stationID, fuelTypeID string, price float64) {
	h.db.Exec(
		"UPDATE price_submissions SET moderation_status = 'approved', updated_at = NOW() WHERE id = $1",
		submissionID,
	)
	h.updateFuelPrice(stationID, fuelTypeID, price)
}

// updateFuelPrice upserts the fuel price for a station/fuel type combination
func (h *PriceSubmissionHandler) updateFuelPrice(stationID, fuelTypeID string, price float64) {
	// Upsert: insert or update the fuel price
	h.db.Exec(`
		INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
		VALUES ($1, $2, $3, $4, 'AUD', 'litre', NOW(), 'verified', 1)
		ON CONFLICT (station_id, fuel_type_id) 
		DO UPDATE SET price = $4, last_updated_at = NOW(), 
			verification_status = 'verified',
			confirmation_count = fuel_prices.confirmation_count + 1,
			updated_at = NOW()
	`, uuid.New().String(), stationID, fuelTypeID, price)
}

// nilIfEmpty returns nil for empty strings, used for nullable DB columns
func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
