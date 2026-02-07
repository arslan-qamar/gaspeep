package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// BroadcastHandler handles broadcast endpoints
type BroadcastHandler struct {
	db *sql.DB
}

func NewBroadcastHandler(db *sql.DB) *BroadcastHandler {
	return &BroadcastHandler{db: db}
}

// CreateBroadcast handles POST /api/broadcasts
func (h *BroadcastHandler) CreateBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		StationID      string `json:"stationId" binding:"required"`
		Title          string `json:"title" binding:"required"`
		Message        string `json:"message" binding:"required"`
		TargetRadiusKm int    `json:"targetRadiusKm" binding:"required,min=1,max=100"`
		StartDate      time.Time `json:"startDate" binding:"required"`
		EndDate        time.Time `json:"endDate" binding:"required"`
		TargetFuelTypes string `json:"targetFuelTypes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New().String()
	query := `
		INSERT INTO broadcasts (
			id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9, NOW())
		RETURNING id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks`

	var broadcast struct {
		ID               string    `json:"id"`
		StationOwnerID   string    `json:"stationOwnerId"`
		StationID        string    `json:"stationId"`
		Title            string    `json:"title"`
		Message          string    `json:"message"`
		TargetRadiusKm   int       `json:"targetRadiusKm"`
		StartDate        time.Time `json:"startDate"`
		EndDate          time.Time `json:"endDate"`
		BroadcastStatus  string    `json:"broadcastStatus"`
		TargetFuelTypes  string    `json:"targetFuelTypes"`
		CreatedAt        time.Time `json:"createdAt"`
		Views            int       `json:"views"`
		Clicks           int       `json:"clicks"`
	}

	err := h.db.QueryRow(query, id, userID.(string), req.StationID, req.Title, req.Message, req.TargetRadiusKm, req.StartDate, req.EndDate, req.TargetFuelTypes).Scan(
		&broadcast.ID, &broadcast.StationOwnerID, &broadcast.StationID, &broadcast.Title, &broadcast.Message, &broadcast.TargetRadiusKm, &broadcast.StartDate, &broadcast.EndDate, &broadcast.BroadcastStatus, &broadcast.TargetFuelTypes, &broadcast.CreatedAt, &broadcast.Views, &broadcast.Clicks,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create broadcast"})
		return
	}

	c.JSON(http.StatusCreated, broadcast)
}

// GetBroadcasts handles GET /api/broadcasts
func (h *BroadcastHandler) GetBroadcasts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	query := `
		SELECT id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks
		FROM broadcasts WHERE station_owner_id = $1 ORDER BY created_at DESC LIMIT 100`

	rows, err := h.db.Query(query, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch broadcasts"})
		return
	}
	defer rows.Close()

	broadcasts := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, stationOwnerID, stationID, title, message, broadcastStatus, targetFuelTypes string
			targetRadiusKm, views, clicks int
			startDate, endDate, createdAt time.Time
		)

		if err := rows.Scan(&id, &stationOwnerID, &stationID, &title, &message, &targetRadiusKm, &startDate, &endDate, &broadcastStatus, &targetFuelTypes, &createdAt, &views, &clicks); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan broadcast"})
			return
		}

		broadcast := map[string]interface{}{
			"id":               id,
			"stationOwnerId":   stationOwnerID,
			"stationId":        stationID,
			"title":            title,
			"message":          message,
			"targetRadiusKm":   targetRadiusKm,
			"startDate":        startDate,
			"endDate":          endDate,
			"broadcastStatus":  broadcastStatus,
			"targetFuelTypes":  targetFuelTypes,
			"createdAt":        createdAt,
			"views":            views,
			"clicks":           clicks,
		}
		broadcasts = append(broadcasts, broadcast)
	}

	c.JSON(http.StatusOK, broadcasts)
}

// UpdateBroadcast handles PUT /api/broadcasts/:id
func (h *BroadcastHandler) UpdateBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	id := c.Param("id")

	var req struct {
		Title          string    `json:"title"`
		Message        string    `json:"message"`
		TargetRadiusKm int       `json:"targetRadiusKm"`
		StartDate      time.Time `json:"startDate"`
		EndDate        time.Time `json:"endDate"`
		BroadcastStatus string   `json:"broadcastStatus"`
		TargetFuelTypes string   `json:"targetFuelTypes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE broadcasts SET title = COALESCE($1, title), message = COALESCE($2, message), target_radius_km = COALESCE($3, target_radius_km), start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), broadcast_status = COALESCE($6, broadcast_status), target_fuel_types = COALESCE($7, target_fuel_types), updated_at = NOW() WHERE id = $8 AND station_owner_id = $9 RETURNING id`

	var updatedID string
	err := h.db.QueryRow(query, req.Title, req.Message, req.TargetRadiusKm, req.StartDate, req.EndDate, req.BroadcastStatus, req.TargetFuelTypes, id, userID.(string)).Scan(&updatedID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "broadcast not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update broadcast"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": updatedID, "message": "broadcast updated"})
}
