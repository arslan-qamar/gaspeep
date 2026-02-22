package service

import (
	"testing"

	"gaspeep/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockBrandRepository mocks the BrandRepository interface.
type MockBrandRepository struct {
	mock.Mock
}

func (m *MockBrandRepository) GetAll() ([]models.Brand, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Brand), args.Error(1)
}

func (m *MockBrandRepository) GetByID(id string) (*models.Brand, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Brand), args.Error(1)
}

func TestBrandService_GetBrands_CallsRepository(t *testing.T) {
	mockRepo := new(MockBrandRepository)
	service := NewBrandService(mockRepo)

	expectedBrands := []models.Brand{{ID: "brand-1", Name: "Shell"}}
	mockRepo.On("GetAll").Return(expectedBrands, nil)

	result, err := service.GetBrands()

	require.NoError(t, err)
	assert.Equal(t, expectedBrands, result)
	mockRepo.AssertExpectations(t)
}

func TestBrandService_GetBrand_CallsRepository(t *testing.T) {
	mockRepo := new(MockBrandRepository)
	service := NewBrandService(mockRepo)

	expectedBrand := &models.Brand{ID: "brand-1", Name: "Shell"}
	mockRepo.On("GetByID", "brand-1").Return(expectedBrand, nil)

	result, err := service.GetBrand("brand-1")

	require.NoError(t, err)
	assert.Equal(t, expectedBrand, result)
	mockRepo.AssertExpectations(t)
}
