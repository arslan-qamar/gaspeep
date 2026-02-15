package repository

import "gaspeep/backend/internal/models"

// NotificationRepository defines data-access operations for notifications.
type NotificationRepository interface {
	GetByUserID(userID string) ([]models.Notification, error)
}
