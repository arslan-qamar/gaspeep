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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create broadcast", "details": err.Error()})
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

// GetBroadcast handles GET /api/broadcasts/:id
func (h *BroadcastHandler) GetBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	broadcast, err := h.broadcastService.GetBroadcast(id, userID.(string))
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "broadcast not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch broadcast"})
		return
	}

	c.JSON(http.StatusOK, broadcast)
}

// GetBroadcastEngagement handles GET /api/broadcasts/:id/engagement
func (h *BroadcastHandler) GetBroadcastEngagement(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	engagement, err := h.broadcastService.GetEngagement(id, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch engagement"})
		return
	}

	c.JSON(http.StatusOK, engagement)
}

// SaveDraft handles POST /api/broadcasts/draft
func (h *BroadcastHandler) SaveDraft(c *gin.Context) {
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
		StartDate       time.Time `json:"startDate"`
		EndDate         time.Time `json:"endDate"`
		TargetFuelTypes string    `json:"targetFuelTypes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	broadcast, err := h.broadcastService.SaveDraft(userID.(string), repository.CreateBroadcastInput{
		StationID:       req.StationID,
		Title:           req.Title,
		Message:         req.Message,
		TargetRadiusKm:  req.TargetRadiusKm,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		TargetFuelTypes: req.TargetFuelTypes,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save draft", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, broadcast)
}

// SendBroadcast handles POST /api/broadcasts/:id/send
func (h *BroadcastHandler) SendBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	broadcast, err := h.broadcastService.SendBroadcast(id, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send broadcast"})
		return
	}

	c.JSON(http.StatusOK, broadcast)
}

// ScheduleBroadcast handles POST /api/broadcasts/:id/schedule
func (h *BroadcastHandler) ScheduleBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")

	var req struct {
		ScheduledFor time.Time `json:"scheduledFor" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	broadcast, err := h.broadcastService.ScheduleBroadcast(id, userID.(string), req.ScheduledFor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to schedule broadcast"})
		return
	}

	c.JSON(http.StatusOK, broadcast)
}

// CancelBroadcast handles POST /api/broadcasts/:id/cancel
func (h *BroadcastHandler) CancelBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	if err := h.broadcastService.CancelBroadcast(id, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel broadcast"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "broadcast cancelled"})
}

// DeleteBroadcast handles DELETE /api/broadcasts/:id
func (h *BroadcastHandler) DeleteBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	if err := h.broadcastService.DeleteBroadcast(id, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete broadcast"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "broadcast deleted"})
}

// DuplicateBroadcast handles POST /api/broadcasts/:id/duplicate
func (h *BroadcastHandler) DuplicateBroadcast(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	broadcast, err := h.broadcastService.DuplicateBroadcast(id, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to duplicate broadcast"})
		return
	}

	c.JSON(http.StatusCreated, broadcast)
}

// EstimateRecipients handles GET /api/broadcasts/estimate-recipients
func (h *BroadcastHandler) EstimateRecipients(c *gin.Context) {
	stationID := c.Query("stationId")
	radiusKm := c.Query("radiusKm")

	if stationID == "" || radiusKm == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "stationId and radiusKm required"})
		return
	}

	count, err := h.broadcastService.EstimateRecipients(stationID, radiusKm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to estimate recipients"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"estimatedCount": count})
}
