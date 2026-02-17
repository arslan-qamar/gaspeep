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
	GetByUserID(userID string) (*models.StationOwner, error)
	GetStationByID(userID, stationID string) (map[string]interface{}, error)
	GetStationWithPrices(userID, stationID string) (map[string]interface{}, error)
	SearchAvailableStations(userID, query, lat, lon, radius string) ([]map[string]interface{}, error)
	ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error)
	UnclaimStation(userID, stationID string) error
	GetFuelPricesForOwner(userID string) (map[string]interface{}, error)
}
