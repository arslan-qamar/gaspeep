package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// StationOwnerService defines business operations for station owners.
type StationOwnerService interface {
	VerifyOwnership(userID string, input repository.CreateOwnerVerificationInput) (*models.StationOwner, error)
	GetStations(userID string) ([]map[string]interface{}, error)
}

type stationOwnerService struct {
	stationOwnerRepo repository.StationOwnerRepository
}

func NewStationOwnerService(stationOwnerRepo repository.StationOwnerRepository) StationOwnerService {
	return &stationOwnerService{stationOwnerRepo: stationOwnerRepo}
}

func (s *stationOwnerService) VerifyOwnership(userID string, input repository.CreateOwnerVerificationInput) (*models.StationOwner, error) {
	return s.stationOwnerRepo.CreateVerificationRequest(userID, input)
}

func (s *stationOwnerService) GetStations(userID string) ([]map[string]interface{}, error) {
	return s.stationOwnerRepo.GetStationsByOwnerUserID(userID)
}
