package handler

import (
	"database/sql"
	"net/http"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// AlertHandler handles alert endpoints
type AlertHandler struct {
	alertService service.AlertService
}

func NewAlertHandler(alertService service.AlertService) *AlertHandler {
	return &AlertHandler{alertService: alertService}
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

	alert, err := h.alertService.CreateAlert(userID.(string), repository.CreateAlertInput{
		FuelTypeID:     req.FuelTypeID,
		PriceThreshold: req.PriceThreshold,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		RadiusKm:       req.RadiusKm,
		AlertName:      req.AlertName,
	})
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

	alerts, err := h.alertService.GetAlerts(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch alerts"})
		return
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

	updatedID, err := h.alertService.UpdateAlert(id, userID.(string), repository.UpdateAlertInput{
		PriceThreshold: req.PriceThreshold,
		RadiusKm:       req.RadiusKm,
		AlertName:      req.AlertName,
		IsActive:       req.IsActive,
	})
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

	deleted, err := h.alertService.DeleteAlert(id, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete alert"})
		return
	}
	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert deleted"})
}
