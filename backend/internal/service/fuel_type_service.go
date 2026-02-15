package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// FuelTypeService defines business operations for fuel types.
type FuelTypeService interface {
	GetFuelTypes() ([]models.FuelType, error)
	GetFuelType(id string) (*models.FuelType, error)
}

type fuelTypeService struct {
	fuelTypeRepo repository.FuelTypeRepository
}

func NewFuelTypeService(fuelTypeRepo repository.FuelTypeRepository) FuelTypeService {
	return &fuelTypeService{fuelTypeRepo: fuelTypeRepo}
}

func (s *fuelTypeService) GetFuelTypes() ([]models.FuelType, error) {
	return s.fuelTypeRepo.GetAll()
}

func (s *fuelTypeService) GetFuelType(id string) (*models.FuelType, error) {
	return s.fuelTypeRepo.GetByID(id)
}
