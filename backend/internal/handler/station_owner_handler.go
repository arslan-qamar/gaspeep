package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StationOwnerHandler handles station owner endpoints
type StationOwnerHandler struct {
	db *sql.DB
}

func NewStationOwnerHandler(db *sql.DB) *StationOwnerHandler {
	return &StationOwnerHandler{db: db}
}

// VerifyOwnership handles POST /api/station-owners/verify
func (h *StationOwnerHandler) VerifyOwnership(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		BusinessName         string `json:"businessName" binding:"required"`
		VerificationDocuments string `json:"verificationDocuments" binding:"required"`
		ContactInfo          string `json:"contactInfo" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New().String()
	query := `
		INSERT INTO station_owners (
			id, user_id, business_name, verification_status, verification_documents, contact_info, created_at
		) VALUES ($1, $2, $3, 'pending', $4, $5, NOW())
		RETURNING id, user_id, business_name, verification_status, verification_documents, contact_info, created_at, verified_at`

	var owner struct {
		ID                   string    `json:"id"`
		UserID               string    `json:"userId"`
		BusinessName         string    `json:"businessName"`
		VerificationStatus   string    `json:"verificationStatus"`
		VerificationDocuments string   `json:"verificationDocuments"`
		ContactInfo          string    `json:"contactInfo"`
		CreatedAt            time.Time `json:"createdAt"`
		VerifiedAt           *time.Time `json:"verifiedAt"`
	}

	err := h.db.QueryRow(query, id, userID.(string), req.BusinessName, req.VerificationDocuments, req.ContactInfo).Scan(
		&owner.ID, &owner.UserID, &owner.BusinessName, &owner.VerificationStatus, &owner.VerificationDocuments, &owner.ContactInfo, &owner.CreatedAt, &owner.VerifiedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify ownership"})
		return
	}

	c.JSON(http.StatusCreated, owner)
}

// GetStations handles GET /api/station-owners/stations
func (h *StationOwnerHandler) GetStations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	query := `
		SELECT s.id, s.name, s.brand, s.address, s.latitude, s.longitude, s.operating_hours, s.amenities, s.last_verified_at
		FROM stations s
		INNER JOIN station_owners so ON so.id = s.owner_id
		WHERE so.user_id = $1`

	rows, err := h.db.Query(query, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stations"})
		return
	}
	defer rows.Close()

	stations := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			latitude, longitude                      float64
			amenities                                string
			lastVerifiedAt                           time.Time
		)

		if err := rows.Scan(&id, &name, &brand, &address, &latitude, &longitude, &operatingHours, &amenities, &lastVerifiedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan station"})
			return
		}

		station := map[string]interface{}{
			"id":             id,
			"name":           name,
			"brand":          brand,
			"address":        address,
			"latitude":       latitude,
			"longitude":      longitude,
			"operatingHours": operatingHours,
			"amenities":      amenities,
			"lastVerifiedAt": lastVerifiedAt,
		}
		stations = append(stations, station)
	}

	c.JSON(http.StatusOK, stations)
}
