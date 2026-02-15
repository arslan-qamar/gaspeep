package handler

import (
	"net/http"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// StationOwnerHandler handles station owner endpoints
type StationOwnerHandler struct {
	stationOwnerService service.StationOwnerService
}

func NewStationOwnerHandler(stationOwnerService service.StationOwnerService) *StationOwnerHandler {
	return &StationOwnerHandler{stationOwnerService: stationOwnerService}
}

// VerifyOwnership handles POST /api/station-owners/verify
func (h *StationOwnerHandler) VerifyOwnership(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		BusinessName          string `json:"businessName" binding:"required"`
		VerificationDocuments string `json:"verificationDocuments" binding:"required"`
		ContactInfo           string `json:"contactInfo" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	owner, err := h.stationOwnerService.VerifyOwnership(userID.(string), repository.CreateOwnerVerificationInput{
		BusinessName:          req.BusinessName,
		VerificationDocuments: req.VerificationDocuments,
		ContactInfo:           req.ContactInfo,
	})
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

	stations, err := h.stationOwnerService.GetStations(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stations"})
		return
	}

	c.JSON(http.StatusOK, stations)
}
