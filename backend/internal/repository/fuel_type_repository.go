package repository

import "gaspeep/backend/internal/models"

// FuelTypeRepository defines data-access operations for fuel types.
type FuelTypeRepository interface {
	GetAll() ([]models.FuelType, error)
	GetByID(id string) (*models.FuelType, error)
}
