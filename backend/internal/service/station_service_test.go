package service

import (
	"testing"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockStationRepository mocks the StationRepository interface
type MockStationRepository struct {
	mock.Mock
}

func (m *MockStationRepository) GetStations(lat, lon, radiusKm float64, fuelTypeID string) ([]models.Station, error) {
	args := m.Called(lat, lon, radiusKm, fuelTypeID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

func (m *MockStationRepository) GetStationByID(id string) (*models.Station, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Station), args.Error(1)
}

func (m *MockStationRepository) CreateStation(input repository.CreateStationInput) (*models.Station, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Station), args.Error(1)
}

func (m *MockStationRepository) UpdateStation(id string, input repository.UpdateStationInput) (bool, error) {
	args := m.Called(id, input)
	return args.Bool(0), args.Error(1)
}

func (m *MockStationRepository) DeleteStation(id string) (bool, error) {
	args := m.Called(id)
	return args.Bool(0), args.Error(1)
}

func (m *MockStationRepository) GetStationsNearby(lat, lon float64, radiusKm int, fuelTypes []string, maxPrice float64) ([]models.Station, error) {
	args := m.Called(lat, lon, radiusKm, fuelTypes, maxPrice)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

func (m *MockStationRepository) SearchStations(searchQuery string, limit int) ([]models.Station, error) {
	args := m.Called(searchQuery, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

// ============ Station Service Tests ============

func TestStationService_GetStations_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	expectedStations := []models.Station{{ID: "test-station"}}
	mockRepo.On("GetStations", 1.0, 2.0, 5.0, "fuel-id").Return(expectedStations, nil)

	result, err := service.GetStations(1.0, 2.0, 5.0, "fuel-id")

	require.NoError(t, err)
	assert.Equal(t, expectedStations, result)
	mockRepo.AssertExpectations(t)
}

func TestStationService_GetStationByID_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	expectedStation := &models.Station{ID: "test-station"}
	mockRepo.On("GetStationByID", "test-station").Return(expectedStation, nil)

	result, err := service.GetStationByID("test-station")

	require.NoError(t, err)
	assert.Equal(t, expectedStation, result)
	mockRepo.AssertExpectations(t)
}
