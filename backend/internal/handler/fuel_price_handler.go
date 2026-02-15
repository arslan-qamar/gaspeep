package handler

import (
	"net/http"
	"strconv"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type FuelPriceHandler struct {
	fuelPriceService service.FuelPriceService
}

func NewFuelPriceHandler(fuelPriceService service.FuelPriceService) *FuelPriceHandler {
	return &FuelPriceHandler{fuelPriceService: fuelPriceService}
}

// GetFuelPrices retrieves fuel prices with optional filters
func (h *FuelPriceHandler) GetFuelPrices(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lon, _ := strconv.ParseFloat(c.Query("lon"), 64)
	radiusKm, _ := strconv.ParseFloat(c.Query("radius"), 64)

	filters := repository.FuelPriceFilters{
		StationID:  c.Query("stationId"),
		FuelTypeID: c.Query("fuelTypeId"),
		Lat:        lat,
		Lon:        lon,
		RadiusKm:   radiusKm,
		MinPrice:   c.Query("minPrice"),
		MaxPrice:   c.Query("maxPrice"),
	}

	prices, err := h.fuelPriceService.GetFuelPrices(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fuel prices"})
		return
	}

	c.JSON(http.StatusOK, prices)
}

// GetStationPrices retrieves all fuel prices for a specific station
func (h *FuelPriceHandler) GetStationPrices(c *gin.Context) {
	stationID := c.Param("id")

	prices, err := h.fuelPriceService.GetStationPrices(stationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch station prices"})
		return
	}

	c.JSON(http.StatusOK, prices)
}

// GetCheapestPrices retrieves the cheapest price for each fuel type within a radius
func (h *FuelPriceHandler) GetCheapestPrices(c *gin.Context) {
	lat := c.Query("lat")
	lon := c.Query("lon")
	radius := c.Query("radius")

	if lat == "" || lon == "" || radius == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat, lon, and radius are required"})
		return
	}

	latitude, _ := strconv.ParseFloat(lat, 64)
	longitude, _ := strconv.ParseFloat(lon, 64)
	radiusKm, _ := strconv.ParseFloat(radius, 64)

	prices, err := h.fuelPriceService.GetCheapestPrices(latitude, longitude, radiusKm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cheapest prices"})
		return
	}

	c.JSON(http.StatusOK, prices)
}
