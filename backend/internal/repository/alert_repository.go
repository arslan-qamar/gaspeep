package repository

import (
	"gaspeep/backend/internal/models"
)

// CreateAlertInput holds parameters for creating an alert.
type CreateAlertInput struct {
	FuelTypeID     string
	PriceThreshold float64
	Latitude       float64
	Longitude      float64
	RadiusKm       int
	AlertName      string
}

// UpdateAlertInput holds parameters for updating an alert.
type UpdateAlertInput struct {
	PriceThreshold float64
	RadiusKm       int
	AlertName      string
	IsActive       *bool
}

// AlertRepository defines data-access operations for alerts.
type AlertRepository interface {
	Create(userID string, input CreateAlertInput) (*models.Alert, error)
	GetByUserID(userID string) ([]models.Alert, error)
	Update(id, userID string, input UpdateAlertInput) (string, error)
	Delete(id, userID string) (bool, error)
}
