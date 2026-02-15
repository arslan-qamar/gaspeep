package handler

import (
	"database/sql"
	"net/http"

	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type FuelTypeHandler struct {
	fuelTypeService service.FuelTypeService
}

func NewFuelTypeHandler(fuelTypeService service.FuelTypeService) *FuelTypeHandler {
	return &FuelTypeHandler{fuelTypeService: fuelTypeService}
}

// GetFuelTypes retrieves all fuel types ordered by display order
func (h *FuelTypeHandler) GetFuelTypes(c *gin.Context) {
	fuelTypes, err := h.fuelTypeService.GetFuelTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fuel types"})
		return
	}

	c.JSON(http.StatusOK, fuelTypes)
}

// GetFuelType retrieves a single fuel type by ID
func (h *FuelTypeHandler) GetFuelType(c *gin.Context) {
	id := c.Param("id")

	ft, err := h.fuelTypeService.GetFuelType(id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fuel type not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fuel type"})
		return
	}

	c.JSON(http.StatusOK, ft)
}
