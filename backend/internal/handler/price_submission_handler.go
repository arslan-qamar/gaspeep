package handler

import (
	"database/sql"
	"errors"
	"io"
	"net/http"
	"strconv"

	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// PriceSubmissionHandler handles price submission endpoints
type PriceSubmissionHandler struct {
	submissionService service.PriceSubmissionService
	ocrService        service.OCRService
}

// NewPriceSubmissionHandler creates a new PriceSubmissionHandler
func NewPriceSubmissionHandler(submissionService service.PriceSubmissionService) *PriceSubmissionHandler {
	return &PriceSubmissionHandler{submissionService: submissionService}
}

// SetOCRService wires OCR processing for analyze-photo endpoints.
func (h *PriceSubmissionHandler) SetOCRService(ocrService service.OCRService) {
	h.ocrService = ocrService
}

// CreatePriceSubmission handles POST /api/price-submissions
func (h *PriceSubmissionHandler) CreatePriceSubmission(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	type submissionEntry struct {
		FuelTypeID string  `json:"fuelTypeId" binding:"required"`
		Price      float64 `json:"price" binding:"required,gt=0"`
	}

	var req struct {
		StationID         string            `json:"stationId" binding:"required"`
		FuelTypeID        string            `json:"fuelTypeId"`
		Price             float64           `json:"price"`
		SubmissionMethod  string            `json:"submissionMethod" binding:"required,oneof=text voice photo"`
		PhotoURL          string            `json:"photoUrl"`
		VoiceRecordingURL string            `json:"voiceRecordingUrl"`
		OCRData           string            `json:"ocrData"`
		Entries           []submissionEntry `json:"entries"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entries := req.Entries
	if len(entries) == 0 {
		if req.FuelTypeID == "" || req.Price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "fuelTypeId and price are required when entries is not provided"})
			return
		}
		entries = []submissionEntry{{
			FuelTypeID: req.FuelTypeID,
			Price:      req.Price,
		}}
	}

	submissions := make([]any, 0, len(entries))
	for _, entry := range entries {
		submission, err := h.submissionService.CreateSubmission(userID.(string), service.CreateSubmissionRequest{
			StationID:         req.StationID,
			FuelTypeID:        entry.FuelTypeID,
			Price:             entry.Price,
			SubmissionMethod:  req.SubmissionMethod,
			PhotoURL:          req.PhotoURL,
			VoiceRecordingURL: req.VoiceRecordingURL,
			OCRData:           req.OCRData,
		})

		if errors.Is(err, service.ErrStationNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "station not found"})
			return
		}
		if errors.Is(err, service.ErrFuelTypeNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "fuel type not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create price submission"})
			return
		}

		submissions = append(submissions, submission)
	}

	if len(req.Entries) == 0 {
		c.JSON(http.StatusCreated, submissions[0])
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"submissions": submissions,
		"count":       len(submissions),
	})
}

// AnalyzePhoto handles POST /api/price-submissions/analyze-photo
func (h *PriceSubmissionHandler) AnalyzePhoto(c *gin.Context) {
	if h.ocrService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "photo analysis is not configured"})
		return
	}

	file, _, err := c.Request.FormFile("photo")
	if err != nil {
		file, _, err = c.Request.FormFile("image")
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "photo file is required"})
		return
	}
	defer file.Close()

	const maxImageBytes = 10 << 20 // 10MB
	imageBytes, err := io.ReadAll(io.LimitReader(file, maxImageBytes+1))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read uploaded photo"})
		return
	}
	if len(imageBytes) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "uploaded photo is empty"})
		return
	}
	if len(imageBytes) > maxImageBytes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "uploaded photo exceeds 10MB limit"})
		return
	}

	result, err := h.ocrService.AnalyzeFuelPrices(c.Request.Context(), imageBytes, "")
	if err != nil {
		switch {
		case errors.Is(err, service.ErrOCRNoTextDetected):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "could not detect readable fuel prices due to: " + err.Error()})
		case errors.Is(err, service.ErrOCRUnavailable):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "photo analysis is temporarily unavailable and error is: " + err.Error()})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to analyze photo"})
		}
		return
	}

	if len(result.Entries) == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "could not detect readable fuel prices"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entries": result.Entries,
		"ocrData": result.OCRData,
	})
}

// GetMySubmissions handles GET /api/price-submissions/my-submissions
func (h *PriceSubmissionHandler) GetMySubmissions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	submissions, total, err := h.submissionService.GetMySubmissions(userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch submissions"})
		return
	}

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
func (h *PriceSubmissionHandler) GetModerationQueue(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	submissions, total, err := h.submissionService.GetModerationQueue(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch moderation queue"})
		return
	}

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

	updated, err := h.submissionService.ModerateSubmission(id, req.Status, req.ModeratorNotes)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update submission"})
		return
	}
	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "submission " + req.Status,
		"id":      id,
	})
}
