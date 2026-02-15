package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// NotificationService defines business operations for notifications.
type NotificationService interface {
	GetNotifications(userID string) ([]models.Notification, error)
}

type notificationService struct {
	notificationRepo repository.NotificationRepository
}

func NewNotificationService(notificationRepo repository.NotificationRepository) NotificationService {
	return &notificationService{notificationRepo: notificationRepo}
}

func (s *notificationService) GetNotifications(userID string) ([]models.Notification, error) {
	return s.notificationRepo.GetByUserID(userID)
}
