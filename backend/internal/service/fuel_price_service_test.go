package service

import (
	"testing"

	"gaspeep/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockFuelPriceRepositoryTest mocks FuelPriceRepository for testing
type MockFuelPriceRepositoryTest struct {
	mock.Mock
}

func (m *MockFuelPriceRepositoryTest) GetFuelPrices(filters repository.FuelPriceFilters) ([]repository.FuelPriceResult, error) {
	args := m.Called(filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.FuelPriceResult), args.Error(1)
}

func (m *MockFuelPriceRepositoryTest) GetStationPrices(stationID string) ([]repository.StationPriceResult, error) {
	args := m.Called(stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.StationPriceResult), args.Error(1)
}

func (m *MockFuelPriceRepositoryTest) GetCheapestPrices(lat, lon, radiusKm float64) ([]repository.CheapestPriceResult, error) {
	args := m.Called(lat, lon, radiusKm)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.CheapestPriceResult), args.Error(1)
}

func (m *MockFuelPriceRepositoryTest) StationExists(stationID string) (bool, error) {
	args := m.Called(stationID)
	return args.Bool(0), args.Error(1)
}

func (m *MockFuelPriceRepositoryTest) FuelTypeExists(fuelTypeID string) (bool, error) {
	args := m.Called(fuelTypeID)
	return args.Bool(0), args.Error(1)
}

func (m *MockFuelPriceRepositoryTest) UpsertFuelPrice(stationID, fuelTypeID string, price float64) error {
	args := m.Called(stationID, fuelTypeID, price)
	return args.Error(0)
}

// ============ Fuel Price Service Tests ============

func TestFuelPriceService_GetFuelPrices_CallsRepository(t *testing.T) {
	mockRepo := new(MockFuelPriceRepositoryTest)
	service := NewFuelPriceService(mockRepo)

	filters := repository.FuelPriceFilters{Lat: 1.0, Lon: 2.0}
	expectedResults := []repository.FuelPriceResult{{ID: "price-1"}}
	mockRepo.On("GetFuelPrices", filters).Return(expectedResults, nil)

	result, err := service.GetFuelPrices(filters)

	require.NoError(t, err)
	assert.Equal(t, expectedResults, result)
	mockRepo.AssertExpectations(t)
}

func TestFuelPriceService_GetStationPrices_CallsRepository(t *testing.T) {
	mockRepo := new(MockFuelPriceRepositoryTest)
	service := NewFuelPriceService(mockRepo)

	expectedResults := []repository.StationPriceResult{{ID: "price-1"}}
	mockRepo.On("GetStationPrices", "station-1").Return(expectedResults, nil)

	result, err := service.GetStationPrices("station-1")

	require.NoError(t, err)
	assert.Equal(t, expectedResults, result)
	mockRepo.AssertExpectations(t)
}
