package handler

import (
	"database/sql"
	"net/http"
	"strconv"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type StationHandler struct {
	stationService service.StationService
}

func NewStationHandler(stationService service.StationService) *StationHandler {
	return &StationHandler{stationService: stationService}
}

// GetStations retrieves stations with optional geospatial filtering
func (h *StationHandler) GetStations(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lon, _ := strconv.ParseFloat(c.Query("lon"), 64)
	radiusKm, _ := strconv.ParseFloat(c.Query("radius"), 64)
	fuelTypeID := c.Query("fuelTypeId")

	stations, err := h.stationService.GetStations(lat, lon, radiusKm, fuelTypeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stations"})
		return
	}

	c.JSON(http.StatusOK, stations)
}

// GetStation retrieves a single station by ID
func (h *StationHandler) GetStation(c *gin.Context) {
	id := c.Param("id")

	station, err := h.stationService.GetStationByID(id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Station not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch station"})
		return
	}

	c.JSON(http.StatusOK, station)
}

// CreateStation creates a new station
func (h *StationHandler) CreateStation(c *gin.Context) {
	var input struct {
		Name           string   `json:"name" binding:"required"`
		Brand          string   `json:"brand" binding:"required"`
		Address        string   `json:"address" binding:"required"`
		Latitude       float64  `json:"latitude" binding:"required"`
		Longitude      float64  `json:"longitude" binding:"required"`
		OperatingHours string   `json:"operatingHours"`
		Amenities      []string `json:"amenities"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Latitude < -90 || input.Latitude > 90 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}
	if input.Longitude < -180 || input.Longitude > 180 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	station, err := h.stationService.CreateStation(repository.CreateStationInput{
		Name:           input.Name,
		Brand:          input.Brand,
		Address:        input.Address,
		Latitude:       input.Latitude,
		Longitude:      input.Longitude,
		OperatingHours: input.OperatingHours,
		Amenities:      input.Amenities,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create station"})
		return
	}

	c.JSON(http.StatusCreated, station)
}

// UpdateStation updates an existing station
func (h *StationHandler) UpdateStation(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Name           string   `json:"name"`
		Brand          string   `json:"brand"`
		Address        string   `json:"address"`
		Latitude       float64  `json:"latitude"`
		Longitude      float64  `json:"longitude"`
		OperatingHours string   `json:"operatingHours"`
		Amenities      []string `json:"amenities"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.stationService.UpdateStation(id, repository.UpdateStationInput{
		Name:           input.Name,
		Brand:          input.Brand,
		Address:        input.Address,
		Latitude:       input.Latitude,
		Longitude:      input.Longitude,
		OperatingHours: input.OperatingHours,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update station"})
		return
	}
	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Station not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Station updated successfully"})
}

// DeleteStation deletes a station
func (h *StationHandler) DeleteStation(c *gin.Context) {
	id := c.Param("id")

	deleted, err := h.stationService.DeleteStation(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete station"})
		return
	}
	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "Station not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Station deleted successfully"})
}

// GetStationsNearby handles POST /api/stations/nearby with fuel price filtering
func (h *StationHandler) GetStationsNearby(c *gin.Context) {
	var req struct {
		Latitude  float64  `json:"latitude" binding:"required"`
		Longitude float64  `json:"longitude" binding:"required"`
		RadiusKm  int      `json:"radiusKm" binding:"required,min=1,max=50"`
		FuelTypes []string `json:"fuelTypes"`
		MaxPrice  float64  `json:"maxPrice"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameters: " + err.Error()})
		return
	}

	stations, err := h.stationService.GetStationsNearby(req.Latitude, req.Longitude, req.RadiusKm, req.FuelTypes, req.MaxPrice)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stations)
}

// SearchStations handles GET /api/stations/search
func (h *StationHandler) SearchStations(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	stations, err := h.stationService.SearchStations(query, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stations)
}
