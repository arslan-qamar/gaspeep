package service

import (
	"testing"

	"gaspeep/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockFuelTypeRepository mocks the FuelTypeRepository interface
type MockFuelTypeRepository struct {
	mock.Mock
}

func (m *MockFuelTypeRepository) GetAll() ([]models.FuelType, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FuelType), args.Error(1)
}

func (m *MockFuelTypeRepository) GetByID(id string) (*models.FuelType, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.FuelType), args.Error(1)
}

// ============ Fuel Type Service Tests ============

func TestFuelTypeService_GetFuelTypes_CallsRepository(t *testing.T) {
	mockRepo := new(MockFuelTypeRepository)
	service := NewFuelTypeService(mockRepo)

	expectedFuelTypes := []models.FuelType{{ID: "fuel-1", Name: "E10"}}
	mockRepo.On("GetAll").Return(expectedFuelTypes, nil)

	result, err := service.GetFuelTypes()

	require.NoError(t, err)
	assert.Equal(t, expectedFuelTypes, result)
	mockRepo.AssertExpectations(t)
}

func TestFuelTypeService_GetFuelType_CallsRepository(t *testing.T) {
	mockRepo := new(MockFuelTypeRepository)
	service := NewFuelTypeService(mockRepo)

	expectedFuelType := &models.FuelType{ID: "fuel-1", Name: "E10"}
	mockRepo.On("GetByID", "fuel-1").Return(expectedFuelType, nil)

	result, err := service.GetFuelType("fuel-1")

	require.NoError(t, err)
	assert.Equal(t, expectedFuelType, result)
	mockRepo.AssertExpectations(t)
}
