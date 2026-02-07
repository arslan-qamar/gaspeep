package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"gaspeep/backend/internal/models"
)

type FuelTypeHandler struct {
	db *sql.DB
}

func NewFuelTypeHandler(db *sql.DB) *FuelTypeHandler {
	return &FuelTypeHandler{db: db}
}

// GetFuelTypes retrieves all fuel types ordered by display order
func (h *FuelTypeHandler) GetFuelTypes(c *gin.Context) {
	query := `
		SELECT id, name, display_name, description, color_code, display_order
		FROM fuel_types
		ORDER BY display_order`
	
	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fuel types"})
		return
	}
	defer rows.Close()

	fuelTypes := []models.FuelType{}
	for rows.Next() {
		var ft models.FuelType
		if err := rows.Scan(&ft.ID, &ft.Name, &ft.DisplayName, &ft.Description, &ft.ColorCode, &ft.DisplayOrder); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan fuel type"})
			return
		}
		fuelTypes = append(fuelTypes, ft)
	}

	c.JSON(http.StatusOK, fuelTypes)
}

// GetFuelType retrieves a single fuel type by ID
func (h *FuelTypeHandler) GetFuelType(c *gin.Context) {
	id := c.Param("id")

	var ft models.FuelType
	query := `
		SELECT id, name, display_name, description, color_code, display_order
		FROM fuel_types
		WHERE id = $1`
	
	err := h.db.QueryRow(query, id).Scan(
		&ft.ID, &ft.Name, &ft.DisplayName, &ft.Description, &ft.ColorCode, &ft.DisplayOrder,
	)
	
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
