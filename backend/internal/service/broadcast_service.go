package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// BroadcastService defines business operations for broadcasts.
type BroadcastService interface {
	CreateBroadcast(stationOwnerID string, input repository.CreateBroadcastInput) (*models.Broadcast, error)
	GetBroadcasts(stationOwnerID string) ([]models.Broadcast, error)
	UpdateBroadcast(id, ownerID string, input repository.UpdateBroadcastInput) (string, error)
}

type broadcastService struct {
	broadcastRepo repository.BroadcastRepository
}

func NewBroadcastService(broadcastRepo repository.BroadcastRepository) BroadcastService {
	return &broadcastService{broadcastRepo: broadcastRepo}
}

func (s *broadcastService) CreateBroadcast(stationOwnerID string, input repository.CreateBroadcastInput) (*models.Broadcast, error) {
	return s.broadcastRepo.Create(stationOwnerID, input)
}

func (s *broadcastService) GetBroadcasts(stationOwnerID string) ([]models.Broadcast, error) {
	return s.broadcastRepo.GetByOwnerID(stationOwnerID)
}

func (s *broadcastService) UpdateBroadcast(id, ownerID string, input repository.UpdateBroadcastInput) (string, error) {
	return s.broadcastRepo.Update(id, ownerID, input)
}
