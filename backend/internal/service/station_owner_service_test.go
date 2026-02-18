package service

import (
	"testing"
	"time"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockStationOwnerRepositoryForOwnerService mocks the StationOwnerRepository interface
// (using a different name to avoid conflict with the one in broadcast_service_test.go)
type MockStationOwnerRepositoryForOwnerService struct {
	mock.Mock
}

func (m *MockStationOwnerRepositoryForOwnerService) GetByUserID(userID string) (*models.StationOwner, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) CreateVerificationRequest(userID string, input repository.CreateOwnerVerificationInput) (*models.StationOwner, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) GetStationsByOwnerUserID(userID string) ([]map[string]interface{}, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) GetStationWithPrices(userID, stationID string) (map[string]interface{}, error) {
	args := m.Called(userID, stationID)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) SearchAvailableStations(userID, query, lat, lon, radius string) ([]map[string]interface{}, error) {
	args := m.Called(userID, query, lat, lon, radius)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error) {
	args := m.Called(userID, stationID, verificationMethod, documentUrls, phoneNumber, email)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) GetStationByID(userID, stationID string) (map[string]interface{}, error) {
	args := m.Called(userID, stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) UnclaimStation(userID, stationID string) error {
	args := m.Called(userID, stationID)
	return args.Error(0)
}

func (m *MockStationOwnerRepositoryForOwnerService) GetFuelPricesForOwner(userID string) (map[string]interface{}, error) {
	args := m.Called(userID)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepositoryForOwnerService) UpdateProfile(userID string, input repository.UpdateOwnerProfileInput) (*models.StationOwner, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

// Helper function to set up tests
func setupStationOwnerTest(t *testing.T) (*stationOwnerService, *MockStationOwnerRepositoryForOwnerService) {
	mockOwnerRepo := new(MockStationOwnerRepositoryForOwnerService)
	service := NewStationOwnerService(mockOwnerRepo).(*stationOwnerService)
	return service, mockOwnerRepo
}

// ============ GetProfile Tests ============

func TestGetProfile_OwnerDoesNotExist_ReturnsDefaultProfile(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	mockOwnerRepo.On("GetByUserID", "user-1").Return(nil, assert.AnError)

	result, err := service.GetProfile("user-1")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "user-1", result["userId"])
	assert.Equal(t, "not_verified", result["verificationStatus"])
	assert.Empty(t, result["businessName"])
}

func TestGetProfile_OwnerExists_ReturnsActualProfile(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	owner := &models.StationOwner{
		ID:                 "owner-123",
		UserID:             "user-1",
		BusinessName:       "My Gas Station",
		VerificationStatus: "verified",
		CreatedAt:          time.Now(),
	}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	result, err := service.GetProfile("user-1")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "owner-123", result["id"])
	assert.Equal(t, "user-1", result["userId"])
	assert.Equal(t, "My Gas Station", result["businessName"])
	assert.Equal(t, "verified", result["verificationStatus"])
}

// ============ GetStats Tests ============

func TestGetStats_CalculatesVerifiedStationCount(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	owner := &models.StationOwner{
		ID:   "owner-1",
		Plan: "basic",
	}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	stations := []map[string]interface{}{
		{"verificationStatus": "verified"},
		{"verificationStatus": "verified"},
		{"verificationStatus": "unverified"},
	}
	mockOwnerRepo.On("GetStationsByOwnerUserID", "user-1").Return(stations, nil)

	result, err := service.GetStats("user-1")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 3, result["totalStations"])
	assert.Equal(t, 2, result["verifiedStations"])
	assert.Equal(t, "basic", result["plan"])
}

func TestGetStats_NoStations_ReturnsZeros(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	owner := &models.StationOwner{
		ID:   "owner-1",
		Plan: "premium",
	}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	mockOwnerRepo.On("GetStationsByOwnerUserID", "user-1").Return([]map[string]interface{}{}, nil)

	result, err := service.GetStats("user-1")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 0, result["totalStations"])
	assert.Equal(t, 0, result["verifiedStations"])
	assert.Equal(t, "premium", result["plan"])
}

func TestGetStats_MixedVerificationStatus(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	owner := &models.StationOwner{
		ID:   "owner-1",
		Plan: "enterprise",
	}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	stations := []map[string]interface{}{
		{"verificationStatus": "verified"},
		{"verificationStatus": "pending"},
		{"verificationStatus": "verified"},
		{"verificationStatus": "rejected"},
	}
	mockOwnerRepo.On("GetStationsByOwnerUserID", "user-1").Return(stations, nil)

	result, err := service.GetStats("user-1")

	require.NoError(t, err)
	assert.Equal(t, 4, result["totalStations"])
	assert.Equal(t, 2, result["verifiedStations"])
	assert.Equal(t, "enterprise", result["plan"])
}

// ============ UnclaimStation Tests ============

func TestUnclaimStation_ValidOwnership_Success(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	station := map[string]interface{}{
		"id":    "station-123",
		"owner": "user-1",
	}
	mockOwnerRepo.On("GetStationByID", "user-1", "station-123").Return(station, nil)
	mockOwnerRepo.On("UnclaimStation", "user-1", "station-123").Return(nil)

	err := service.UnclaimStation("user-1", "station-123")

	require.NoError(t, err)
	mockOwnerRepo.AssertExpectations(t)
}

func TestUnclaimStation_StationNotFound_ReturnsError(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	mockOwnerRepo.On("GetStationByID", "user-1", "nonexistent").Return(nil, assert.AnError)

	err := service.UnclaimStation("user-1", "nonexistent")

	assert.Error(t, err)
	mockOwnerRepo.AssertNotCalled(t, "UnclaimStation")
}

func TestUnclaimStation_UserNotOwner_ReturnsError(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	mockOwnerRepo.On("GetStationByID", "user-1", "station-123").Return(nil, nil)

	err := service.UnclaimStation("user-1", "station-123")

	assert.Error(t, err)
	mockOwnerRepo.AssertNotCalled(t, "UnclaimStation")
}

// ============ GetStations Tests ============

func TestGetStations_Success(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	stations := []map[string]interface{}{
		{"id": "station-1", "name": "Shell Sydney"},
		{"id": "station-2", "name": "BP Melbourne"},
	}
	mockOwnerRepo.On("GetStationsByOwnerUserID", "user-1").Return(stations, nil)

	result, err := service.GetStations("user-1")

	require.NoError(t, err)
	assert.Equal(t, stations, result)
}

// ============ GetStationDetails Tests ============

func TestGetStationDetails_Success(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	stationDetails := map[string]interface{}{
		"id":   "station-123",
		"name": "Shell Sydney",
		"fuel_prices": []map[string]interface{}{
			{"fuel_type": "E10", "price": 1.50},
		},
	}
	mockOwnerRepo.On("GetStationWithPrices", "user-1", "station-123").Return(stationDetails, nil)

	result, err := service.GetStationDetails("user-1", "station-123")

	require.NoError(t, err)
	assert.Equal(t, stationDetails, result)
}

// ============ SearchAvailableStations Tests ============

func TestSearchAvailableStations_Success(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	stations := []map[string]interface{}{
		{"id": "station-1", "name": "Available Station 1"},
		{"id": "station-2", "name": "Available Station 2"},
	}
	mockOwnerRepo.On("SearchAvailableStations", "", "Shell", "-33.8568", "151.2153", "10").Return(stations, nil)

	result, err := service.SearchAvailableStations("Shell", "-33.8568", "151.2153", "10")

	require.NoError(t, err)
	assert.Equal(t, stations, result)
}

// ============ GetFuelPrices Tests ============

func TestGetFuelPrices_Success(t *testing.T) {
	service, mockOwnerRepo := setupStationOwnerTest(t)

	fuelPrices := map[string]interface{}{
		"e10":    1.55,
		"diesel": 1.75,
	}
	mockOwnerRepo.On("GetFuelPricesForOwner", "user-1").Return(fuelPrices, nil)

	result, err := service.GetFuelPrices("user-1")

	require.NoError(t, err)
	assert.Equal(t, fuelPrices, result)
}
