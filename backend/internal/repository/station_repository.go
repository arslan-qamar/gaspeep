package repository

import "gaspeep/backend/internal/models"

// CreateStationInput holds parameters for creating a station.
type CreateStationInput struct {
	Name           string
	Brand          string
	Address        string
	Latitude       float64
	Longitude      float64
	OperatingHours string
	Amenities      []string
}

// UpdateStationInput holds parameters for updating a station.
type UpdateStationInput struct {
	Name           string
	Brand          string
	Address        string
	Latitude       float64
	Longitude      float64
	OperatingHours string
}

// StationRepository defines data-access operations for stations.
type StationRepository interface {
	GetStations(lat, lon, radiusKm float64, fuelTypeID string) ([]models.Station, error)
	GetStationByID(id string) (*models.Station, error)
	CreateStation(input CreateStationInput) (*models.Station, error)
	UpdateStation(id string, input UpdateStationInput) (bool, error)
	DeleteStation(id string) (bool, error)
	GetStationsNearby(lat, lon float64, radiusKm int, fuelTypes []string, maxPrice float64) ([]models.Station, error)
	SearchStations(searchQuery string, limit int) ([]models.Station, error)
	SearchStationsNearby(lat, lon float64, radiusKm int, searchQuery string, fuelTypes []string, brands []string, maxPrice float64) ([]models.Station, error)
}
