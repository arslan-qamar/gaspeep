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

func (m *MockStationRepository) SearchStationsNearby(lat, lon float64, radiusKm int, searchQuery string, fuelTypes []string, maxPrice float64) ([]models.Station, error) {
	args := m.Called(lat, lon, radiusKm, searchQuery, fuelTypes, maxPrice)
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

func TestStationService_CreateStation_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	input := repository.CreateStationInput{
		Name:      "New Station",
		Brand:     "Brand A",
		Address:   "1 Main St",
		Latitude:  -33.8,
		Longitude: 151.2,
	}
	expected := &models.Station{ID: "station-2", Name: "New Station"}
	mockRepo.On("CreateStation", input).Return(expected, nil)

	result, err := service.CreateStation(input)

	require.NoError(t, err)
	assert.Equal(t, expected, result)
	mockRepo.AssertExpectations(t)
}

func TestStationService_UpdateStation_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	input := repository.UpdateStationInput{
		Name: "Updated Station",
	}
	mockRepo.On("UpdateStation", "station-1", input).Return(true, nil)

	result, err := service.UpdateStation("station-1", input)

	require.NoError(t, err)
	assert.True(t, result)
	mockRepo.AssertExpectations(t)
}

func TestStationService_DeleteStation_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	mockRepo.On("DeleteStation", "station-1").Return(true, nil)

	result, err := service.DeleteStation("station-1")

	require.NoError(t, err)
	assert.True(t, result)
	mockRepo.AssertExpectations(t)
}

func TestStationService_GetStationsNearby_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	fuelTypes := []string{"e10", "diesel"}
	expectedStations := []models.Station{{ID: "nearby-1"}}
	mockRepo.On("GetStationsNearby", -33.8, 151.2, 10, fuelTypes, 2.2).Return(expectedStations, nil)

	result, err := service.GetStationsNearby(-33.8, 151.2, 10, fuelTypes, 2.2)

	require.NoError(t, err)
	assert.Equal(t, expectedStations, result)
	mockRepo.AssertExpectations(t)
}

func TestStationService_SearchStations_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	expectedStations := []models.Station{{ID: "search-1"}}
	mockRepo.On("SearchStations", "shell", 5).Return(expectedStations, nil)

	result, err := service.SearchStations("shell", 5)

	require.NoError(t, err)
	assert.Equal(t, expectedStations, result)
	mockRepo.AssertExpectations(t)
}

func TestStationService_SearchStationsNearby_CallsRepository(t *testing.T) {
	mockRepo := new(MockStationRepository)
	service := NewStationService(mockRepo)

	fuelTypes := []string{"premium"}
	expectedStations := []models.Station{{ID: "nearby-search-1"}}
	mockRepo.On("SearchStationsNearby", -33.8, 151.2, 15, "bp", fuelTypes, 2.0).Return(expectedStations, nil)

	result, err := service.SearchStationsNearby(-33.8, 151.2, 15, "bp", fuelTypes, 2.0)

	require.NoError(t, err)
	assert.Equal(t, expectedStations, result)
	mockRepo.AssertExpectations(t)
}
