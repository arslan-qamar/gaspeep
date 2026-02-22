package repository

import "gaspeep/backend/internal/models"

// BrandRepository defines data-access operations for brands.
type BrandRepository interface {
	GetAll() ([]models.Brand, error)
	GetByID(id string) (*models.Brand, error)
}
