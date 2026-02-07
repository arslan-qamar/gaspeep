package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AlertHandler handles alert endpoints
type AlertHandler struct {
	db *sql.DB
}

func NewAlertHandler(db *sql.DB) *AlertHandler {
	return &AlertHandler{db: db}
}

// CreateAlert handles POST /api/alerts
func (h *AlertHandler) CreateAlert(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		FuelTypeID     string  `json:"fuelTypeId" binding:"required"`
		PriceThreshold float64 `json:"priceThreshold" binding:"required,gt=0"`
		Latitude       float64 `json:"latitude" binding:"required"`
		Longitude      float64 `json:"longitude" binding:"required"`
		RadiusKm       int     `json:"radiusKm" binding:"required,min=1,max=50"`
		AlertName      string  `json:"alertName" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New().String()
	query := `
		INSERT INTO alerts (
			id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, is_active, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
		RETURNING id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, is_active, created_at, last_triggered_at, trigger_count`

	var alert struct {
		ID             string    `json:"id"`
		UserID         string    `json:"userId"`
		FuelTypeID     string    `json:"fuelTypeId"`
		PriceThreshold float64   `json:"priceThreshold"`
		Latitude       float64   `json:"latitude"`
		Longitude      float64   `json:"longitude"`
		RadiusKm       int       `json:"radiusKm"`
		AlertName      string    `json:"alertName"`
		IsActive       bool      `json:"isActive"`
		CreatedAt      time.Time `json:"createdAt"`
		LastTriggeredAt *time.Time `json:"lastTriggeredAt"`
		TriggerCount   int       `json:"triggerCount"`
	}

	err := h.db.QueryRow(
		query,
		id, userID.(string), req.FuelTypeID, req.PriceThreshold, req.Latitude, req.Longitude, req.RadiusKm, req.AlertName,
	).Scan(
		&alert.ID, &alert.UserID, &alert.FuelTypeID, &alert.PriceThreshold, &alert.Latitude, &alert.Longitude, &alert.RadiusKm, &alert.AlertName, &alert.IsActive, &alert.CreatedAt, &alert.LastTriggeredAt, &alert.TriggerCount,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create alert"})
		return
	}

	c.JSON(http.StatusCreated, alert)
}

// GetAlerts handles GET /api/alerts
func (h *AlertHandler) GetAlerts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	query := `
		SELECT id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, is_active, created_at, last_triggered_at, trigger_count
		FROM alerts WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := h.db.Query(query, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch alerts"})
		return
	}
	defer rows.Close()

	alerts := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, uid, fuelTypeID, alertName string
			priceThreshold                  float64
			latitude, longitude             float64
			radiusKm                        int
			isActive                        bool
			createdAt                       time.Time
			lastTriggeredAt                 sql.NullTime
			triggerCount                    int
		)

		if err := rows.Scan(
			&id, &uid, &fuelTypeID, &priceThreshold, &latitude, &longitude, &radiusKm, &alertName, &isActive, &createdAt, &lastTriggeredAt, &triggerCount,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan alert"})
			return
		}

		alert := map[string]interface{}{
			"id":             id,
			"userId":         uid,
			"fuelTypeId":     fuelTypeID,
			"priceThreshold": priceThreshold,
			"latitude":       latitude,
			"longitude":      longitude,
			"radiusKm":       radiusKm,
			"alertName":      alertName,
			"isActive":       isActive,
			"createdAt":      createdAt,
			"triggerCount":   triggerCount,
		}
		if lastTriggeredAt.Valid {
			alert["lastTriggeredAt"] = lastTriggeredAt.Time
		}
		alerts = append(alerts, alert)
	}

	c.JSON(http.StatusOK, alerts)
}

// UpdateAlert handles PUT /api/alerts/:id
func (h *AlertHandler) UpdateAlert(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	id := c.Param("id")

	var req struct {
		PriceThreshold float64 `json:"priceThreshold"`
		RadiusKm       int     `json:"radiusKm"`
		AlertName      string  `json:"alertName"`
		IsActive       *bool   `json:"isActive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE alerts SET price_threshold = COALESCE($1, price_threshold), radius_km = COALESCE($2, radius_km), alert_name = COALESCE($3, alert_name), is_active = COALESCE($4, is_active), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING id`

	var updatedID string
	err := h.db.QueryRow(query, req.PriceThreshold, req.RadiusKm, req.AlertName, req.IsActive, id, userID.(string)).Scan(&updatedID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": updatedID, "message": "alert updated"})
}

// DeleteAlert handles DELETE /api/alerts/:id
func (h *AlertHandler) DeleteAlert(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	id := c.Param("id")

	result, err := h.db.Exec("DELETE FROM alerts WHERE id = $1 AND user_id = $2", id, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete alert"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert deleted"})
}
