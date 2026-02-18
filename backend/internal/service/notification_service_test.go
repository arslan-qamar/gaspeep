package service

import (
	"testing"

	"gaspeep/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockNotificationRepository mocks the NotificationRepository interface
type MockNotificationRepository struct {
	mock.Mock
}

func (m *MockNotificationRepository) GetByUserID(userID string) ([]models.Notification, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Notification), args.Error(1)
}

// ============ Notification Service Tests ============

func TestNotificationService_GetNotifications_CallsRepository(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo)

	expectedNotifications := []models.Notification{{ID: "notif-1"}}
	mockRepo.On("GetByUserID", "user-1").Return(expectedNotifications, nil)

	result, err := service.GetNotifications("user-1")

	require.NoError(t, err)
	assert.Equal(t, expectedNotifications, result)
	mockRepo.AssertExpectations(t)
}
