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

// MockBroadcastRepository mocks the BroadcastRepository interface
type MockBroadcastRepository struct {
	mock.Mock
}

func (m *MockBroadcastRepository) Create(ownerID string, input repository.CreateBroadcastInput) (*models.Broadcast, error) {
	args := m.Called(ownerID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastRepository) GetByOwnerID(ownerID string) ([]models.Broadcast, error) {
	args := m.Called(ownerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Broadcast), args.Error(1)
}

func (m *MockBroadcastRepository) Update(id, ownerID string, input repository.UpdateBroadcastInput) (string, error) {
	args := m.Called(id, ownerID, input)
	return args.String(0), args.Error(1)
}

func (m *MockBroadcastRepository) GetByID(id, ownerID string) (*models.Broadcast, error) {
	args := m.Called(id, ownerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Broadcast), args.Error(1)
}

func (m *MockBroadcastRepository) Delete(id, ownerID string) error {
	args := m.Called(id, ownerID)
	return args.Error(0)
}

// MockStationOwnerRepository mocks the StationOwnerRepository interface (partial)
type MockStationOwnerRepository struct {
	mock.Mock
}

func (m *MockStationOwnerRepository) GetByUserID(userID string) (*models.StationOwner, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

func (m *MockStationOwnerRepository) CreateVerificationRequest(userID string, input repository.CreateOwnerVerificationInput) (*models.StationOwner, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

func (m *MockStationOwnerRepository) GetStationsByOwnerUserID(userID string) ([]map[string]interface{}, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepository) GetStationWithPrices(userID, stationID string) (map[string]interface{}, error) {
	args := m.Called(userID, stationID)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepository) SearchAvailableStations(userID, query, lat, lon, radius string) ([]map[string]interface{}, error) {
	args := m.Called(userID, query, lat, lon, radius)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepository) ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error) {
	args := m.Called(userID, stationID, verificationMethod, documentUrls, phoneNumber, email)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepository) GetStationByID(userID, stationID string) (map[string]interface{}, error) {
	args := m.Called(userID, stationID)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepository) UnclaimStation(userID, stationID string) error {
	args := m.Called(userID, stationID)
	return args.Error(0)
}

func (m *MockStationOwnerRepository) GetFuelPricesForOwner(userID string) (map[string]interface{}, error) {
	args := m.Called(userID)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockStationOwnerRepository) UpdateProfile(userID string, input repository.UpdateOwnerProfileInput) (*models.StationOwner, error) {
	args := m.Called(userID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StationOwner), args.Error(1)
}

// Helper function to set up tests
func setupBroadcastTest(t *testing.T) (*broadcastService, *MockBroadcastRepository, *MockStationOwnerRepository) {
	mockBroadcastRepo := new(MockBroadcastRepository)
	mockOwnerRepo := new(MockStationOwnerRepository)
	service := NewBroadcastService(mockBroadcastRepo, mockOwnerRepo).(*broadcastService)
	return service, mockBroadcastRepo, mockOwnerRepo
}

// ============ CreateBroadcast Tests ============

func TestCreateBroadcast_ValidInput_Success(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	expectedBroadcast := &models.Broadcast{
		ID:              "bc-123",
		StationOwnerID:  "owner-123",
		StationID:       "station-123",
		Title:           "Sale Alert",
		Message:         "25% off this weekend",
		TargetRadiusKm:  5,
		BroadcastStatus: "scheduled",
		StartDate:       time.Now().Add(1 * time.Hour),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
	}
	mockBroadcastRepo.On("Create", "owner-123", mock.Anything).Return(expectedBroadcast, nil)

	result, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID:      "station-123",
		Title:          "Sale Alert",
		Message:        "25% off this weekend",
		TargetRadiusKm: 5,
		StartDate:      expectedBroadcast.StartDate,
		EndDate:        expectedBroadcast.EndDate,
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "bc-123", result.ID)
	mockOwnerRepo.AssertExpectations(t)
	mockBroadcastRepo.AssertExpectations(t)
}

func TestCreateBroadcast_EmptyUserID_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.CreateBroadcast("", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "Test",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_EmptyStationID_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "",
		Title:     "Test",
		Message:   "Test",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_EmptyTitle_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "",
		Message:   "Test",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_EmptyMessage_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_ZeroStartDate_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "Test",
		StartDate: time.Time{},
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_ZeroEndDate_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "Test",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Time{},
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_EndDateBeforeStartDate_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	startDate := time.Now().Add(7 * 24 * time.Hour)
	endDate := time.Now().Add(1 * time.Hour)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "Test",
		StartDate: startDate,
		EndDate:   endDate,
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_OwnerNotFound_ReturnsError(t *testing.T) {
	service, _, mockOwnerRepo := setupBroadcastTest(t)

	mockOwnerRepo.On("GetByUserID", "user-1").Return(nil, assert.AnError)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "Test",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

func TestCreateBroadcast_UserHasNoOwnerProfile_ReturnsError(t *testing.T) {
	service, _, mockOwnerRepo := setupBroadcastTest(t)

	mockOwnerRepo.On("GetByUserID", "user-1").Return(nil, nil)

	_, err := service.CreateBroadcast("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Test",
		Message:   "Test",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	assert.Error(t, err)
}

// ============ GetBroadcasts Tests ============

func TestGetBroadcasts_Success_ReturnsBroadcasts(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcasts := []models.Broadcast{
		{ID: "bc-1"},
		{ID: "bc-2"},
	}
	mockBroadcastRepo.On("GetByOwnerID", "owner-123").Return(broadcasts, nil)

	result, err := service.GetBroadcasts("user-1")

	require.NoError(t, err)
	assert.Equal(t, broadcasts, result)
}

func TestGetBroadcasts_OwnerNotFound_ReturnsEmptyArray(t *testing.T) {
	service, _, mockOwnerRepo := setupBroadcastTest(t)

	mockOwnerRepo.On("GetByUserID", "user-1").Return(nil, assert.AnError)

	result, err := service.GetBroadcasts("user-1")

	require.NoError(t, err)
	assert.Equal(t, []models.Broadcast{}, result)
}

func TestGetBroadcasts_NilBroadcasts_ReturnsEmptyArray(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)
	mockBroadcastRepo.On("GetByOwnerID", "owner-123").Return(nil, nil)

	result, err := service.GetBroadcasts("user-1")

	require.NoError(t, err)
	assert.Equal(t, []models.Broadcast{}, result)
}

// ============ SaveDraft Tests ============

func TestSaveDraft_ValidInput_Success(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	createdBroadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "scheduled",
	}
	mockBroadcastRepo.On("Create", "owner-123", mock.Anything).Return(createdBroadcast, nil)

	updatedBroadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "draft",
	}
	mockBroadcastRepo.On("Update", "bc-123", "owner-123", mock.Anything).Return("bc-123", nil)
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(updatedBroadcast, nil)

	result, err := service.SaveDraft("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "Draft Broadcast",
		Message:   "This is a draft",
		StartDate: time.Now().Add(1 * time.Hour),
		EndDate:   time.Now().Add(7 * 24 * time.Hour),
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "draft", result.BroadcastStatus)
}

func TestSaveDraft_EmptyTitle_ReturnsError(t *testing.T) {
	service, _, _ := setupBroadcastTest(t)

	_, err := service.SaveDraft("user-1", repository.CreateBroadcastInput{
		StationID: "station-123",
		Title:     "",
		Message:   "Test",
	})

	assert.Error(t, err)
}

// ============ SendBroadcast Tests ============

func TestSendBroadcast_Success_UpdatesToActive(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "scheduled",
		Title:           "Test",
		Message:         "Test",
		TargetRadiusKm:  5,
		StartDate:       time.Now().Add(1 * time.Hour),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
	}

	activeBroadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "active",
		Title:           "Test",
		Message:         "Test",
		TargetRadiusKm:  5,
		StartDate:       time.Now().Add(1 * time.Hour),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
	}

	// First GetByID returns scheduled broadcast, Update succeeds, second GetByID returns active
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil).Once()
	mockBroadcastRepo.On("Update", "bc-123", "owner-123", mock.Anything).Return("bc-123", nil)
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(activeBroadcast, nil).Once()

	result, err := service.SendBroadcast("bc-123", "user-1")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "active", result.BroadcastStatus)
}

// ============ ScheduleBroadcast Tests ============

func TestScheduleBroadcast_Success_UpdatesToScheduled(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		Title:           "Test",
		Message:         "Test",
		TargetRadiusKm:  5,
		StartDate:       time.Now(),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
	}

	scheduledBroadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "scheduled",
		Title:           "Test",
		Message:         "Test",
		TargetRadiusKm:  5,
		StartDate:       time.Now().Add(24 * time.Hour),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
	}

	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil).Once()
	mockBroadcastRepo.On("Update", "bc-123", "owner-123", mock.Anything).Return("bc-123", nil)
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(scheduledBroadcast, nil).Once()

	result, err := service.ScheduleBroadcast("bc-123", "user-1", time.Now().Add(24*time.Hour))

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "scheduled", result.BroadcastStatus)
}

// ============ CancelBroadcast Tests ============

func TestCancelBroadcast_ScheduledBroadcast_Success(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "scheduled",
		Title:           "Test",
		Message:         "Test",
		TargetRadiusKm:  5,
		StartDate:       time.Now(),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)
	mockBroadcastRepo.On("Update", "bc-123", "owner-123", mock.Anything).Return("bc-123", nil)

	err := service.CancelBroadcast("bc-123", "user-1")

	require.NoError(t, err)
	mockBroadcastRepo.AssertExpectations(t)
}

func TestCancelBroadcast_ActiveBroadcast_ReturnsError(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "active",
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)

	err := service.CancelBroadcast("bc-123", "user-1")

	assert.Error(t, err)
	mockBroadcastRepo.AssertNotCalled(t, "Update")
}

func TestCancelBroadcast_DraftBroadcast_ReturnsError(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "draft",
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)

	err := service.CancelBroadcast("bc-123", "user-1")

	assert.Error(t, err)
}

// ============ DeleteBroadcast Tests ============

func TestDeleteBroadcast_DraftBroadcast_Success(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "draft",
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)
	mockBroadcastRepo.On("Delete", "bc-123", "owner-123").Return(nil)

	err := service.DeleteBroadcast("bc-123", "user-1")

	require.NoError(t, err)
}

func TestDeleteBroadcast_CancelledBroadcast_Success(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "cancelled",
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)
	mockBroadcastRepo.On("Delete", "bc-123", "owner-123").Return(nil)

	err := service.DeleteBroadcast("bc-123", "user-1")

	require.NoError(t, err)
}

func TestDeleteBroadcast_ActiveBroadcast_ReturnsError(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "active",
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)

	err := service.DeleteBroadcast("bc-123", "user-1")

	assert.Error(t, err)
	mockBroadcastRepo.AssertNotCalled(t, "Delete")
}

func TestDeleteBroadcast_ScheduledBroadcast_ReturnsError(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	broadcast := &models.Broadcast{
		ID:              "bc-123",
		BroadcastStatus: "scheduled",
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(broadcast, nil)

	err := service.DeleteBroadcast("bc-123", "user-1")

	assert.Error(t, err)
}

// ============ DuplicateBroadcast Tests ============

func TestDuplicateBroadcast_Success_AppendsContribution(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)

	original := &models.Broadcast{
		ID:              "bc-123",
		Title:           "Summer Sale",
		Message:         "Save big",
		TargetRadiusKm:  5,
		StartDate:       time.Now(),
		EndDate:         time.Now().Add(7 * 24 * time.Hour),
		TargetFuelTypes: nil,
	}
	mockBroadcastRepo.On("GetByID", "bc-123", "owner-123").Return(original, nil)

	duplicated := &models.Broadcast{
		ID:    "bc-456",
		Title: "Summer Sale (Copy)",
	}
	mockBroadcastRepo.On("Create", "owner-123", mock.Anything).Return(duplicated, nil)

	result, err := service.DuplicateBroadcast("bc-123", "user-1")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Summer Sale (Copy)", result.Title)
}

func TestDuplicateBroadcast_BroadcastNotFound_ReturnsError(t *testing.T) {
	service, mockBroadcastRepo, mockOwnerRepo := setupBroadcastTest(t)

	owner := &models.StationOwner{ID: "owner-123"}
	mockOwnerRepo.On("GetByUserID", "user-1").Return(owner, nil)
	mockBroadcastRepo.On("GetByID", "nonexistent", "owner-123").Return(nil, assert.AnError)

	_, err := service.DuplicateBroadcast("nonexistent", "user-1")

	assert.Error(t, err)
}
