package repository

import "gaspeep/backend/internal/models"

// CreateOwnerVerificationInput holds parameters for creating a station owner verification request.
type CreateOwnerVerificationInput struct {
	BusinessName          string
	VerificationDocuments string
	ContactInfo           string
}

// StationOwnerRepository defines data-access operations for station owners.
type StationOwnerRepository interface {
	CreateVerificationRequest(userID string, input CreateOwnerVerificationInput) (*models.StationOwner, error)
	GetStationsByOwnerUserID(userID string) ([]map[string]interface{}, error)
}
