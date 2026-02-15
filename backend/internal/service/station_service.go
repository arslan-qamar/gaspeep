package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// StationService defines business operations for stations.
type StationService interface {
	GetStations(lat, lon, radiusKm float64, fuelTypeID string) ([]models.Station, error)
	GetStationByID(id string) (*models.Station, error)
	CreateStation(input repository.CreateStationInput) (*models.Station, error)
	UpdateStation(id string, input repository.UpdateStationInput) (bool, error)
	DeleteStation(id string) (bool, error)
	GetStationsNearby(lat, lon float64, radiusKm int, fuelTypes []string, maxPrice float64) ([]models.Station, error)
	SearchStations(searchQuery string, limit int) ([]models.Station, error)
}

type stationService struct {
	stationRepo repository.StationRepository
}

func NewStationService(stationRepo repository.StationRepository) StationService {
	return &stationService{stationRepo: stationRepo}
}

func (s *stationService) GetStations(lat, lon, radiusKm float64, fuelTypeID string) ([]models.Station, error) {
	return s.stationRepo.GetStations(lat, lon, radiusKm, fuelTypeID)
}

func (s *stationService) GetStationByID(id string) (*models.Station, error) {
	return s.stationRepo.GetStationByID(id)
}

func (s *stationService) CreateStation(input repository.CreateStationInput) (*models.Station, error) {
	return s.stationRepo.CreateStation(input)
}

func (s *stationService) UpdateStation(id string, input repository.UpdateStationInput) (bool, error) {
	return s.stationRepo.UpdateStation(id, input)
}

func (s *stationService) DeleteStation(id string) (bool, error) {
	return s.stationRepo.DeleteStation(id)
}

func (s *stationService) GetStationsNearby(lat, lon float64, radiusKm int, fuelTypes []string, maxPrice float64) ([]models.Station, error) {
	return s.stationRepo.GetStationsNearby(lat, lon, radiusKm, fuelTypes, maxPrice)
}

func (s *stationService) SearchStations(searchQuery string, limit int) ([]models.Station, error) {
	return s.stationRepo.SearchStations(searchQuery, limit)
}
