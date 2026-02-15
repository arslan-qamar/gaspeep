package service

import "gaspeep/backend/internal/repository"

// FuelPriceService defines business operations for fuel prices.
type FuelPriceService interface {
	GetFuelPrices(filters repository.FuelPriceFilters) ([]repository.FuelPriceResult, error)
	GetStationPrices(stationID string) ([]repository.StationPriceResult, error)
	GetCheapestPrices(lat, lon, radiusKm float64) ([]repository.CheapestPriceResult, error)
}

type fuelPriceService struct {
	fuelPriceRepo repository.FuelPriceRepository
}

func NewFuelPriceService(fuelPriceRepo repository.FuelPriceRepository) FuelPriceService {
	return &fuelPriceService{fuelPriceRepo: fuelPriceRepo}
}

func (s *fuelPriceService) GetFuelPrices(filters repository.FuelPriceFilters) ([]repository.FuelPriceResult, error) {
	return s.fuelPriceRepo.GetFuelPrices(filters)
}

func (s *fuelPriceService) GetStationPrices(stationID string) ([]repository.StationPriceResult, error) {
	return s.fuelPriceRepo.GetStationPrices(stationID)
}

func (s *fuelPriceService) GetCheapestPrices(lat, lon, radiusKm float64) ([]repository.CheapestPriceResult, error) {
	return s.fuelPriceRepo.GetCheapestPrices(lat, lon, radiusKm)
}
