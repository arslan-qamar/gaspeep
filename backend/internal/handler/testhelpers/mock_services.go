package testhelpers

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"
	"github.com/stretchr/testify/mock"
)

// MockStationService is a mock implementation of service.StationService
type MockStationService struct {
	mock.Mock
}

func (m *MockStationService) GetStations(lat, lon, radiusKm float64, fuelTypeID string) ([]models.Station, error) {
	args := m.Called(lat, lon, radiusKm, fuelTypeID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

func (m *MockStationService) GetStationByID(id string) (*models.Station, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Station), args.Error(1)
}

func (m *MockStationService) CreateStation(input repository.CreateStationInput) (*models.Station, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Station), args.Error(1)
}

func (m *MockStationService) UpdateStation(id string, input repository.UpdateStationInput) (bool, error) {
	args := m.Called(id, input)
	return args.Bool(0), args.Error(1)
}

func (m *MockStationService) DeleteStation(id string) (bool, error) {
	args := m.Called(id)
	return args.Bool(0), args.Error(1)
}

func (m *MockStationService) GetStationsNearby(lat, lon float64, radiusKm int, fuelTypes []string, maxPrice float64) ([]models.Station, error) {
	args := m.Called(lat, lon, radiusKm, fuelTypes, maxPrice)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

func (m *MockStationService) SearchStations(searchQuery string, limit int) ([]models.Station, error) {
	args := m.Called(searchQuery, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

func (m *MockStationService) SearchStationsNearby(lat, lon float64, radiusKm int, searchQuery string, fuelTypes []string, maxPrice float64) ([]models.Station, error) {
	args := m.Called(lat, lon, radiusKm, searchQuery, fuelTypes, maxPrice)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

// MockFuelPriceService is a mock implementation of service.FuelPriceService
type MockFuelPriceService struct {
	mock.Mock
}

func (m *MockFuelPriceService) GetFuelPrices(filters repository.FuelPriceFilters) ([]models.FuelPrice, error) {
	args := m.Called(filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FuelPrice), args.Error(1)
}

func (m *MockFuelPriceService) GetStationPrices(stationID string) ([]models.FuelPrice, error) {
	args := m.Called(stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FuelPrice), args.Error(1)
}

func (m *MockFuelPriceService) GetCheapestPrices(lat, lon, radiusKm float64) ([]models.FuelPrice, error) {
	args := m.Called(lat, lon, radiusKm)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FuelPrice), args.Error(1)
}

// MockPriceSubmissionService is a mock implementation of service.PriceSubmissionService
type MockPriceSubmissionService struct {
	mock.Mock
}

func (m *MockPriceSubmissionService) CreateSubmission(userID string, req service.CreateSubmissionRequest) (*models.PriceSubmission, error) {
	args := m.Called(userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PriceSubmission), args.Error(1)
}

func (m *MockPriceSubmissionService) GetMySubmissions(userID string, page, limit int) ([]models.PriceSubmission, int, error) {
	args := m.Called(userID, page, limit)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]models.PriceSubmission), args.Int(1), args.Error(2)
}

func (m *MockPriceSubmissionService) GetModerationQueue(status string, page, limit int) ([]models.PriceSubmission, int, error) {
	args := m.Called(status, page, limit)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]models.PriceSubmission), args.Int(1), args.Error(2)
}

func (m *MockPriceSubmissionService) ModerateSubmission(id, status, notes string) (bool, error) {
	args := m.Called(id, status, notes)
	return args.Bool(0), args.Error(1)
}

// MockAlertService is a mock implementation of service.AlertService
type MockAlertService struct {
	mock.Mock
}

func (m *MockAlertService) CreateAlert(userID string, input repository.CreateAlertInput) (*models.Alert, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Alert), args.Error(1)
}

func (m *MockAlertService) GetAlerts(userID string) ([]models.Alert, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Alert), args.Error(1)
}

func (m *MockAlertService) UpdateAlert(id, userID string, input repository.UpdateAlertInput) (string, error) {
	args := m.Called(id, userID, input)
	return args.String(0), args.Error(1)
}

func (m *MockAlertService) DeleteAlert(id, userID string) (bool, error) {
	args := m.Called(id, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockAlertService) GetPriceContext(input repository.PriceContextInput) (*repository.PriceContextResult, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PriceContextResult), args.Error(1)
}

func (m *MockAlertService) GetMatchingStations(alertID, userID string) ([]repository.MatchingStationResult, error) {
	args := m.Called(alertID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.MatchingStationResult), args.Error(1)
}

// MockNotificationService is a mock implementation of service.NotificationService
type MockNotificationService struct {
	mock.Mock
}

func (m *MockNotificationService) GetNotifications(userID string) ([]models.Notification, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Notification), args.Error(1)
}

// MockFuelTypeService is a mock implementation of service.FuelTypeService
type MockFuelTypeService struct {
	mock.Mock
}

func (m *MockFuelTypeService) GetFuelTypes() ([]models.FuelType, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FuelType), args.Error(1)
}

func (m *MockFuelTypeService) GetFuelType(id string) (*models.FuelType, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.FuelType), args.Error(1)
}

// MockBroadcastService is a mock implementation of service.BroadcastService
type MockBroadcastService struct {
	mock.Mock
}

func (m *MockBroadcastService) CreateBroadcast(userID string, input repository.CreateBroadcastInput) (*models.Broadcast, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) GetBroadcasts(userID string) ([]models.Broadcast, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) UpdateBroadcast(id, userID string, input repository.UpdateBroadcastInput) (string, error) {
	args := m.Called(id, userID, input)
	return args.String(0), args.Error(1)
}

func (m *MockBroadcastService) GetBroadcast(id, userID string) (*models.Broadcast, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) GetEngagement(id, userID string) (interface{}, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}

func (m *MockBroadcastService) SaveDraft(userID string, input repository.CreateBroadcastInput) (*models.Broadcast, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) SendBroadcast(id, userID string) (*models.Broadcast, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) ScheduleBroadcast(id, userID string, scheduledFor interface{}) (*models.Broadcast, error) {
	args := m.Called(id, userID, scheduledFor)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) CancelBroadcast(id, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockBroadcastService) DeleteBroadcast(id, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockBroadcastService) DuplicateBroadcast(id, userID string) (*models.Broadcast, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastService) EstimateRecipients(stationID, radiusKm string) (int, error) {
	args := m.Called(stationID, radiusKm)
	return args.Int(0), args.Error(1)
}

// MockStationOwnerService is a mock implementation of service.StationOwnerService
type MockStationOwnerService struct {
	mock.Mock
}

func (m *MockStationOwnerService) VerifyOwnership(userID string, input repository.CreateOwnerVerificationInput) (*models.StationOwner, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

func (m *MockStationOwnerService) GetStations(userID string) ([]models.Station, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Station), args.Error(1)
}

func (m *MockStationOwnerService) GetProfile(userID string) (*models.StationOwner, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

func (m *MockStationOwnerService) GetStats(userID string) (interface{}, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}

func (m *MockStationOwnerService) GetFuelPrices(userID string) ([]models.FuelPrice, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FuelPrice), args.Error(1)
}

func (m *MockStationOwnerService) SearchAvailableStations(query, lat, lon, radius string) ([]map[string]interface{}, error) {
	args := m.Called(query, lat, lon, radius)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerService) ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (interface{}, error) {
	args := m.Called(userID, stationID, verificationMethod, documentUrls, phoneNumber, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}

func (m *MockStationOwnerService) GetStationDetails(userID, stationID string) (interface{}, error) {
	args := m.Called(userID, stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}

func (m *MockStationOwnerService) UpdateStation(userID, stationID string, req interface{}) (interface{}, error) {
	args := m.Called(userID, stationID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}

func (m *MockStationOwnerService) SavePhotos(userID, stationID string, photoURLs []string) (interface{}, error) {
	args := m.Called(userID, stationID, photoURLs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}

func (m *MockStationOwnerService) UnclaimStation(userID, stationID string) error {
	args := m.Called(userID, stationID)
	return args.Error(0)
}

func (m *MockStationOwnerService) ReVerifyStation(userID, stationID string) (interface{}, error) {
	args := m.Called(userID, stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0), args.Error(1)
}
