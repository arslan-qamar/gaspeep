package handler

import (
	"database/sql"
	"net/http"
	"time"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// BroadcastHandler handles broadcast endpoints
type BroadcastHandler struct {
	broadcastService service.BroadcastService
}

func NewBroadcastHandler(broadcastService service.BroadcastService) *BroadcastHandler {
	return &BroadcastHandler{broadcastService: broadcastService}
}

// CreateBroadcast handles POST /api/broadcasts
func (h *BroadcastHandler) CreateBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		StationID       string    `json:"stationId" binding:"required"`
		Title           string    `json:"title" binding:"required"`
		Message         string    `json:"message" binding:"required"`
		TargetRadiusKm  int       `json:"targetRadiusKm" binding:"required,min=1,max=100"`
		StartDate       time.Time `json:"startDate" binding:"required"`
		EndDate         time.Time `json:"endDate" binding:"required"`
		TargetFuelTypes string    `json:"targetFuelTypes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	broadcast, err := h.broadcastService.CreateBroadcast(userID.(string), repository.CreateBroadcastInput{
		StationID:       req.StationID,
		Title:           req.Title,
		Message:         req.Message,
		TargetRadiusKm:  req.TargetRadiusKm,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		TargetFuelTypes: req.TargetFuelTypes,
	})
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

	broadcasts, err := h.broadcastService.GetBroadcasts(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch broadcasts"})
		return
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
		Title           string    `json:"title"`
		Message         string    `json:"message"`
		TargetRadiusKm  int       `json:"targetRadiusKm"`
		StartDate       time.Time `json:"startDate"`
		EndDate         time.Time `json:"endDate"`
		BroadcastStatus string    `json:"broadcastStatus"`
		TargetFuelTypes string    `json:"targetFuelTypes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedID, err := h.broadcastService.UpdateBroadcast(id, userID.(string), repository.UpdateBroadcastInput{
		Title:           req.Title,
		Message:         req.Message,
		TargetRadiusKm:  req.TargetRadiusKm,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		BroadcastStatus: req.BroadcastStatus,
		TargetFuelTypes: req.TargetFuelTypes,
	})
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
