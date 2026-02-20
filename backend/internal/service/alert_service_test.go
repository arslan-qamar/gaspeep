package service

import (
	"testing"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockAlertRepository mocks the AlertRepository interface
type MockAlertRepository struct {
	mock.Mock
}

func (m *MockAlertRepository) Create(userID string, input repository.CreateAlertInput) (*models.Alert, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Alert), args.Error(1)
}

func (m *MockAlertRepository) GetByUserID(userID string) ([]models.Alert, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Alert), args.Error(1)
}

func (m *MockAlertRepository) Update(id, userID string, input repository.UpdateAlertInput) (string, error) {
	args := m.Called(id, userID, input)
	return args.String(0), args.Error(1)
}

func (m *MockAlertRepository) Delete(id, userID string) (bool, error) {
	args := m.Called(id, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockAlertRepository) GetPriceContext(input repository.PriceContextInput) (*repository.PriceContextResult, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PriceContextResult), args.Error(1)
}

func (m *MockAlertRepository) GetMatchingStations(alertID, userID string) ([]repository.MatchingStationResult, error) {
	args := m.Called(alertID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.MatchingStationResult), args.Error(1)
}

func (m *MockAlertRepository) RecordTriggersForPrice(stationID, fuelTypeID string, price float64) ([]repository.TriggeredAlertResult, error) {
	args := m.Called(stationID, fuelTypeID, price)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.TriggeredAlertResult), args.Error(1)
}

// ============ Alert Service Tests ============

func TestAlertService_CreateAlert_CallsRepository(t *testing.T) {
	mockRepo := new(MockAlertRepository)
	service := NewAlertService(mockRepo)

	input := repository.CreateAlertInput{FuelTypeID: "fuel-1"}
	expectedAlert := &models.Alert{ID: "alert-1"}
	mockRepo.On("Create", "user-1", input).Return(expectedAlert, nil)

	result, err := service.CreateAlert("user-1", input)

	require.NoError(t, err)
	assert.Equal(t, expectedAlert, result)
	mockRepo.AssertExpectations(t)
}

func TestAlertService_GetAlerts_CallsRepository(t *testing.T) {
	mockRepo := new(MockAlertRepository)
	service := NewAlertService(mockRepo)

	expectedAlerts := []models.Alert{{ID: "alert-1"}}
	mockRepo.On("GetByUserID", "user-1").Return(expectedAlerts, nil)

	result, err := service.GetAlerts("user-1")

	require.NoError(t, err)
	assert.Equal(t, expectedAlerts, result)
	mockRepo.AssertExpectations(t)
}

func TestAlertService_GetPriceContext_CallsRepository(t *testing.T) {
	mockRepo := new(MockAlertRepository)
	service := NewAlertService(mockRepo)

	input := repository.PriceContextInput{
		FuelTypeID: "fuel-1",
		Latitude:   -33.8688,
		Longitude:  151.2093,
		RadiusKm:   10,
	}
	expected := &repository.PriceContextResult{
		FuelTypeID:   "fuel-1",
		FuelTypeName: "E10",
		StationCount: 2,
	}
	mockRepo.On("GetPriceContext", input).Return(expected, nil)

	result, err := service.GetPriceContext(input)

	require.NoError(t, err)
	assert.Equal(t, expected, result)
	mockRepo.AssertExpectations(t)
}
