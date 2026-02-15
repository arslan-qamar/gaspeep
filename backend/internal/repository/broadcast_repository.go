package repository

import (
	"gaspeep/backend/internal/models"
	"time"
)

// CreateBroadcastInput holds parameters for creating a broadcast.
type CreateBroadcastInput struct {
	StationID       string
	Title           string
	Message         string
	TargetRadiusKm  int
	StartDate       time.Time
	EndDate         time.Time
	TargetFuelTypes string
}

// UpdateBroadcastInput holds parameters for updating a broadcast.
type UpdateBroadcastInput struct {
	Title           string
	Message         string
	TargetRadiusKm  int
	StartDate       time.Time
	EndDate         time.Time
	BroadcastStatus string
	TargetFuelTypes string
}

// BroadcastRepository defines data-access operations for broadcasts.
type BroadcastRepository interface {
	Create(stationOwnerID string, input CreateBroadcastInput) (*models.Broadcast, error)
	GetByOwnerID(stationOwnerID string) ([]models.Broadcast, error)
	Update(id, ownerID string, input UpdateBroadcastInput) (string, error)
}
