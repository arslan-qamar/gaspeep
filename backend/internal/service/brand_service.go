package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// BrandService defines business operations for brands.
type BrandService interface {
	GetBrands() ([]models.Brand, error)
	GetBrand(id string) (*models.Brand, error)
}

type brandService struct {
	brandRepo repository.BrandRepository
}

func NewBrandService(brandRepo repository.BrandRepository) BrandService {
	return &brandService{brandRepo: brandRepo}
}

func (s *brandService) GetBrands() ([]models.Brand, error) {
	return s.brandRepo.GetAll()
}

func (s *brandService) GetBrand(id string) (*models.Brand, error) {
	return s.brandRepo.GetByID(id)
}
