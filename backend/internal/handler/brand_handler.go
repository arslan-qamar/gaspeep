package handler

import (
	"database/sql"
	"net/http"

	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type BrandHandler struct {
	brandService service.BrandService
}

func NewBrandHandler(brandService service.BrandService) *BrandHandler {
	return &BrandHandler{brandService: brandService}
}

// GetBrands retrieves all brands ordered by display order.
func (h *BrandHandler) GetBrands(c *gin.Context) {
	brands, err := h.brandService.GetBrands()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch brands"})
		return
	}

	c.JSON(http.StatusOK, brands)
}

// GetBrand retrieves a single brand by ID.
func (h *BrandHandler) GetBrand(c *gin.Context) {
	id := c.Param("id")

	brand, err := h.brandService.GetBrand(id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Brand not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch brand"})
		return
	}

	c.JSON(http.StatusOK, brand)
}
