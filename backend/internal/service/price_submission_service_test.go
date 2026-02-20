package service

import (
	"testing"

	"gaspeep/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockPriceSubmissionRepository mocks the PriceSubmissionRepository interface
type MockPriceSubmissionRepository struct {
	mock.Mock
}

func (m *MockPriceSubmissionRepository) Create(input repository.CreateSubmissionInput) (*repository.PriceSubmissionResult, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PriceSubmissionResult), args.Error(1)
}

func (m *MockPriceSubmissionRepository) GetByUserID(userID string, limit, offset int) ([]repository.PriceSubmissionWithDetails, int, error) {
	args := m.Called(userID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]repository.PriceSubmissionWithDetails), args.Int(1), args.Error(2)
}

func (m *MockPriceSubmissionRepository) GetModerationQueue(status string, limit, offset int) ([]repository.PriceSubmissionWithDetails, int, error) {
	args := m.Called(status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]repository.PriceSubmissionWithDetails), args.Int(1), args.Error(2)
}

func (m *MockPriceSubmissionRepository) GetSubmissionDetails(id string) (*repository.SubmissionDetails, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.SubmissionDetails), args.Error(1)
}

func (m *MockPriceSubmissionRepository) UpdateModerationStatus(id, status, notes string) (bool, error) {
	args := m.Called(id, status, notes)
	return args.Bool(0), args.Error(1)
}

func (m *MockPriceSubmissionRepository) AutoApprove(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

// MockFuelPriceRepository mocks the FuelPriceRepository interface
type MockFuelPriceRepository struct {
	mock.Mock
}

func (m *MockFuelPriceRepository) GetFuelPrices(filters repository.FuelPriceFilters) ([]repository.FuelPriceResult, error) {
	args := m.Called(filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.FuelPriceResult), args.Error(1)
}

func (m *MockFuelPriceRepository) GetStationPrices(stationID string) ([]repository.StationPriceResult, error) {
	args := m.Called(stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.StationPriceResult), args.Error(1)
}

func (m *MockFuelPriceRepository) GetCheapestPrices(lat, lon, radiusKm float64) ([]repository.CheapestPriceResult, error) {
	args := m.Called(lat, lon, radiusKm)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.CheapestPriceResult), args.Error(1)
}

func (m *MockFuelPriceRepository) StationExists(stationID string) (bool, error) {
	args := m.Called(stationID)
	return args.Bool(0), args.Error(1)
}

func (m *MockFuelPriceRepository) FuelTypeExists(fuelTypeID string) (bool, error) {
	args := m.Called(fuelTypeID)
	return args.Bool(0), args.Error(1)
}

func (m *MockFuelPriceRepository) UpsertFuelPrice(stationID, fuelTypeID string, price float64) error {
	args := m.Called(stationID, fuelTypeID, price)
	return args.Error(0)
}

// Helper function to set up tests
func setupPriceSubmissionTest(t *testing.T) (*priceSubmissionService, *MockFuelPriceRepository, *MockPriceSubmissionRepository) {
	mockFuelPriceRepo := new(MockFuelPriceRepository)
	mockSubmissionRepo := new(MockPriceSubmissionRepository)
	service := NewPriceSubmissionService(mockSubmissionRepo, mockFuelPriceRepo).(*priceSubmissionService)
	return service, mockFuelPriceRepo, mockSubmissionRepo
}

func setupPriceSubmissionTestWithAlert(t *testing.T) (*priceSubmissionService, *MockFuelPriceRepository, *MockPriceSubmissionRepository, *MockAlertRepository) {
	mockFuelPriceRepo := new(MockFuelPriceRepository)
	mockSubmissionRepo := new(MockPriceSubmissionRepository)
	mockAlertRepo := new(MockAlertRepository)
	service := NewPriceSubmissionService(mockSubmissionRepo, mockFuelPriceRepo, mockAlertRepo).(*priceSubmissionService)
	return service, mockFuelPriceRepo, mockSubmissionRepo, mockAlertRepo
}

// ============ CreateSubmission Tests ============

func TestCreateSubmission_ValidPhotoSubmission_AutoApproved(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	mockSubmissionRepo.On("AutoApprove", "sub-789").Return(nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.50).Return(nil)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "sub-789", result.ID)
	mockFuelPriceRepo.AssertExpectations(t)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestCreateSubmission_ValidTextSubmission_AutoApproved(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo, mockAlertRepo := setupPriceSubmissionTestWithAlert(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	mockSubmissionRepo.On("AutoApprove", "sub-789").Return(nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.55).Return(nil)
	mockAlertRepo.On("RecordTriggersForPrice", "station-123", "fuel-456", 1.55).Return([]repository.TriggeredAlertResult{}, nil)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.55,
		SubmissionMethod: "text",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	mockSubmissionRepo.AssertExpectations(t)
	mockFuelPriceRepo.AssertExpectations(t)
	mockAlertRepo.AssertExpectations(t)
}

func TestCreateSubmission_ValidVoiceSubmission_NotAutoApproved(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	// Note: AutoApprove should NOT be called for voice (confidence 0.4 < 0.5)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.60,
		SubmissionMethod: "voice",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	mockFuelPriceRepo.AssertExpectations(t)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestCreateSubmission_DefaultMethod_NotAutoApproved(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.65,
		SubmissionMethod: "unknown_method",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	mockFuelPriceRepo.AssertExpectations(t)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestCreateSubmission_StationNotFound_ReturnsError(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "nonexistent").Return(false, nil)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "nonexistent",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	assert.Error(t, err)
	assert.Equal(t, ErrStationNotFound, err)
	assert.Nil(t, result)
	mockFuelPriceRepo.AssertNotCalled(t, "FuelTypeExists")
	mockSubmissionRepo.AssertNotCalled(t, "Create")
}

func TestCreateSubmission_FuelTypeNotFound_ReturnsError(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "nonexistent").Return(false, nil)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "nonexistent",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	assert.Error(t, err)
	assert.Equal(t, ErrFuelTypeNotFound, err)
	assert.Nil(t, result)
	mockSubmissionRepo.AssertNotCalled(t, "Create")
}

func TestCreateSubmission_StationExistsCheckFails_ReturnsError(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(false, assert.AnError)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	mockSubmissionRepo.AssertNotCalled(t, "Create")
}

func TestCreateSubmission_RepositoryCreateFails_ReturnsError(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(nil, assert.AnError)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	assert.Error(t, err)
	assert.Nil(t, result)
}

func TestCreateSubmission_AutoApproveFails_ReturnsError(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	mockSubmissionRepo.On("AutoApprove", "sub-789").Return(assert.AnError)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	// Error is propagated
	assert.Error(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "sub-789", result.ID)
}

func TestCreateSubmission_PriceUpdateFails_ReturnsError(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	mockSubmissionRepo.On("AutoApprove", "sub-789").Return(nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.50).Return(assert.AnError)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	// Error is propagated
	assert.Error(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "sub-789", result.ID)
}

// ============ GetMySubmissions Tests ============

func TestGetMySubmissions_ValidPagination(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{
		{ID: "sub-1"},
		{ID: "sub-2"},
	}
	mockSubmissionRepo.On("GetByUserID", "user-1", 20, 0).Return(submissions, 2, nil)

	result, total, err := service.GetMySubmissions("user-1", 1, 20)

	require.NoError(t, err)
	assert.Equal(t, submissions, result)
	assert.Equal(t, 2, total)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetMySubmissions_PageLessThanOne_DefaultsToOne(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-1"}}
	mockSubmissionRepo.On("GetByUserID", "user-1", 20, 0).Return(submissions, 1, nil)

	_, total, err := service.GetMySubmissions("user-1", 0, 20)

	require.NoError(t, err)
	assert.Equal(t, 1, total)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetMySubmissions_LimitTooSmall_DefaultsTo20(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-1"}}
	mockSubmissionRepo.On("GetByUserID", "user-1", 20, 0).Return(submissions, 1, nil)

	_, _, err := service.GetMySubmissions("user-1", 1, 0)

	require.NoError(t, err)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetMySubmissions_LimitTooLarge_DefaultsTo20(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-1"}}
	mockSubmissionRepo.On("GetByUserID", "user-1", 20, 0).Return(submissions, 1, nil)

	_, _, err := service.GetMySubmissions("user-1", 1, 150)

	require.NoError(t, err)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetMySubmissions_CalculatesCorrectOffset_Page2(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-21"}}
	// offset = (2-1) * 20 = 20
	mockSubmissionRepo.On("GetByUserID", "user-1", 20, 20).Return(submissions, 50, nil)

	_, total, err := service.GetMySubmissions("user-1", 2, 20)

	require.NoError(t, err)
	assert.Equal(t, 50, total)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetMySubmissions_CalculatesCorrectOffset_Page5Limit10(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-41"}}
	// offset = (5-1) * 10 = 40
	mockSubmissionRepo.On("GetByUserID", "user-1", 10, 40).Return(submissions, 100, nil)

	_, total, err := service.GetMySubmissions("user-1", 5, 10)

	require.NoError(t, err)
	assert.Equal(t, 100, total)
	mockSubmissionRepo.AssertExpectations(t)
}

// ============ GetModerationQueue Tests ============

func TestGetModerationQueue_ValidPagination(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{
		{ID: "sub-1"},
		{ID: "sub-2"},
	}
	mockSubmissionRepo.On("GetModerationQueue", "pending", 20, 0).Return(submissions, 2, nil)

	_, total, err := service.GetModerationQueue("pending", 1, 20)

	require.NoError(t, err)
	assert.Equal(t, 2, total)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetModerationQueue_PageLessThanOne_DefaultsToOne(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-1"}}
	mockSubmissionRepo.On("GetModerationQueue", "pending", 20, 0).Return(submissions, 1, nil)

	_, total, err := service.GetModerationQueue("pending", -1, 20)

	require.NoError(t, err)
	assert.Equal(t, 1, total)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetModerationQueue_LimitValidation(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-1"}}
	mockSubmissionRepo.On("GetModerationQueue", "approved", 20, 0).Return(submissions, 1, nil)

	_, _, err := service.GetModerationQueue("approved", 1, 101)

	require.NoError(t, err)
	mockSubmissionRepo.AssertExpectations(t)
}

func TestGetModerationQueue_CalculatesCorrectOffset(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	submissions := []repository.PriceSubmissionWithDetails{{ID: "sub-31"}}
	// offset = (3-1) * 15 = 30
	mockSubmissionRepo.On("GetModerationQueue", "rejected", 15, 30).Return(submissions, 50, nil)

	_, total, err := service.GetModerationQueue("rejected", 3, 15)

	require.NoError(t, err)
	assert.Equal(t, 50, total)
	mockSubmissionRepo.AssertExpectations(t)
}

// ============ ModerateSubmission Tests ============

func TestModerateSubmission_ApprovedStatus_UpdatesFuelPrice(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo, mockAlertRepo := setupPriceSubmissionTestWithAlert(t)

	details := &repository.SubmissionDetails{
		StationID:  "station-123",
		FuelTypeID: "fuel-456",
		Price:      1.50,
	}
	mockSubmissionRepo.On("GetSubmissionDetails", "sub-1").Return(details, nil)
	mockSubmissionRepo.On("UpdateModerationStatus", "sub-1", "approved", "").Return(true, nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.50).Return(nil)
	mockAlertRepo.On("RecordTriggersForPrice", "station-123", "fuel-456", 1.50).Return([]repository.TriggeredAlertResult{}, nil)

	updated, err := service.ModerateSubmission("sub-1", "approved", "")

	require.NoError(t, err)
	assert.True(t, updated)
	mockSubmissionRepo.AssertExpectations(t)
	mockFuelPriceRepo.AssertExpectations(t)
	mockAlertRepo.AssertExpectations(t)
}

func TestModerateSubmission_RejectedStatus_NoFuelPriceUpdate(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	details := &repository.SubmissionDetails{
		StationID:  "station-123",
		FuelTypeID: "fuel-456",
		Price:      1.50,
	}
	mockSubmissionRepo.On("GetSubmissionDetails", "sub-1").Return(details, nil)
	mockSubmissionRepo.On("UpdateModerationStatus", "sub-1", "rejected", "Spam").Return(true, nil)

	updated, err := service.ModerateSubmission("sub-1", "rejected", "Spam")

	require.NoError(t, err)
	assert.True(t, updated)
	mockFuelPriceRepo.AssertNotCalled(t, "UpsertFuelPrice")
	mockSubmissionRepo.AssertExpectations(t)
}

func TestModerateSubmission_PendingStatus_NoFuelPriceUpdate(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	details := &repository.SubmissionDetails{
		StationID:  "station-123",
		FuelTypeID: "fuel-456",
		Price:      1.50,
	}
	mockSubmissionRepo.On("GetSubmissionDetails", "sub-1").Return(details, nil)
	mockSubmissionRepo.On("UpdateModerationStatus", "sub-1", "pending", "").Return(true, nil)

	updated, err := service.ModerateSubmission("sub-1", "pending", "")

	require.NoError(t, err)
	assert.True(t, updated)
	mockFuelPriceRepo.AssertNotCalled(t, "UpsertFuelPrice")
}

func TestModerateSubmission_SubmissionNotFound_ReturnsError(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockSubmissionRepo.On("GetSubmissionDetails", "nonexistent").Return(nil, assert.AnError)

	updated, err := service.ModerateSubmission("nonexistent", "approved", "")

	assert.Error(t, err)
	assert.False(t, updated)
}

func TestModerateSubmission_UpdateStatusFails_ReturnsError(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	details := &repository.SubmissionDetails{
		StationID:  "station-123",
		FuelTypeID: "fuel-456",
		Price:      1.50,
	}
	mockSubmissionRepo.On("GetSubmissionDetails", "sub-1").Return(details, nil)
	mockSubmissionRepo.On("UpdateModerationStatus", "sub-1", "approved", "").Return(false, assert.AnError)

	updated, err := service.ModerateSubmission("sub-1", "approved", "")

	assert.Error(t, err)
	assert.False(t, updated)
}

func TestModerateSubmission_SubmissionNotUpdated_ReturnsFalse(t *testing.T) {
	service, _, mockSubmissionRepo := setupPriceSubmissionTest(t)

	details := &repository.SubmissionDetails{
		StationID:  "station-123",
		FuelTypeID: "fuel-456",
		Price:      1.50,
	}
	mockSubmissionRepo.On("GetSubmissionDetails", "sub-1").Return(details, nil)
	mockSubmissionRepo.On("UpdateModerationStatus", "sub-1", "approved", "").Return(false, nil)

	updated, err := service.ModerateSubmission("sub-1", "approved", "")

	require.NoError(t, err)
	assert.False(t, updated)
}

func TestModerateSubmission_PriceUpdateFails_ReturnsErrorButStatusUpdated(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	details := &repository.SubmissionDetails{
		StationID:  "station-123",
		FuelTypeID: "fuel-456",
		Price:      1.50,
	}
	mockSubmissionRepo.On("GetSubmissionDetails", "sub-1").Return(details, nil)
	mockSubmissionRepo.On("UpdateModerationStatus", "sub-1", "approved", "").Return(true, nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.50).Return(assert.AnError)

	updated, err := service.ModerateSubmission("sub-1", "approved", "")

	// Status is updated but we get error from price update
	assert.Error(t, err)
	assert.True(t, updated)
}

// ============ Confidence Calculation Tests (implicit through CreateSubmission behavior) ============

func TestCalculateConfidence_PhotoMethod_Returns08(t *testing.T) {
	// Test indirectly through auto-approval behavior
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	mockSubmissionRepo.On("AutoApprove", "sub-789").Return(nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.50).Return(nil)

	result, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "photo",
	})

	// Photo method (0.8 >= 0.5) should trigger auto-approval
	require.NoError(t, err)
	assert.NotNil(t, result)
	mockSubmissionRepo.AssertCalled(t, "AutoApprove", "sub-789")
}

func TestCalculateConfidence_TextMethod_Returns05(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)
	mockSubmissionRepo.On("AutoApprove", "sub-789").Return(nil)
	mockFuelPriceRepo.On("UpsertFuelPrice", "station-123", "fuel-456", 1.50).Return(nil)

	_, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "text",
	})

	// Text method (0.5 >= 0.5) should trigger auto-approval
	require.NoError(t, err)
	mockSubmissionRepo.AssertCalled(t, "AutoApprove", "sub-789")
}

func TestCalculateConfidence_VoiceMethod_Returns04(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)

	_, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "voice",
	})

	// Voice method (0.4 < 0.5) should NOT trigger auto-approval
	require.NoError(t, err)
	mockSubmissionRepo.AssertNotCalled(t, "AutoApprove")
}

func TestCalculateConfidence_UnknownMethod_Returns03(t *testing.T) {
	service, mockFuelPriceRepo, mockSubmissionRepo := setupPriceSubmissionTest(t)

	mockFuelPriceRepo.On("StationExists", "station-123").Return(true, nil)
	mockFuelPriceRepo.On("FuelTypeExists", "fuel-456").Return(true, nil)
	mockSubmissionRepo.On("Create", mock.Anything).Return(&repository.PriceSubmissionResult{ID: "sub-789"}, nil)

	_, err := service.CreateSubmission("user-1", CreateSubmissionRequest{
		StationID:        "station-123",
		FuelTypeID:       "fuel-456",
		Price:            1.50,
		SubmissionMethod: "unknown",
	})

	// Unknown method (0.3 < 0.5) should NOT trigger auto-approval
	require.NoError(t, err)
	mockSubmissionRepo.AssertNotCalled(t, "AutoApprove")
}
