package repository

import (
	"gaspeep/backend/internal/models"
	"time"
)

// CreateAlertInput holds parameters for creating an alert.
type CreateAlertInput struct {
	FuelTypeID     string
	PriceThreshold float64
	Latitude       float64
	Longitude      float64
	RadiusKm       int
	AlertName      string
	NotifyViaPush  bool
	NotifyViaEmail bool
}

// UpdateAlertInput holds parameters for updating an alert.
type UpdateAlertInput struct {
	PriceThreshold float64
	RadiusKm       int
	AlertName      string
	NotifyViaPush  *bool
	NotifyViaEmail *bool
	IsActive       *bool
}

// PriceContextInput holds request parameters for alert price context.
type PriceContextInput struct {
	FuelTypeID string
	Latitude   float64
	Longitude  float64
	RadiusKm   int
}

// PriceContextResult holds aggregate pricing context for alert setup.
type PriceContextResult struct {
	FuelTypeID             string  `json:"fuelTypeId"`
	FuelTypeName           string  `json:"fuelTypeName"`
	AveragePrice           float64 `json:"averagePrice"`
	LowestPrice            float64 `json:"lowestPrice"`
	LowestPriceStationName string  `json:"lowestPriceStationName"`
	LowestPriceStationID   string  `json:"lowestPriceStationId"`
	Currency               string  `json:"currency"`
	Unit                   string  `json:"unit"`
	StationCount           int     `json:"stationCount"`
}

// MatchingStationResult holds stations currently matching an alert threshold.
type MatchingStationResult struct {
	StationID      string     `json:"stationId"`
	StationName    string     `json:"stationName"`
	StationAddress string     `json:"stationAddress"`
	Price          float64    `json:"price"`
	Currency       string     `json:"currency"`
	Unit           string     `json:"unit"`
	Distance       float64    `json:"distance"`
	LastUpdated    *time.Time `json:"lastUpdated"`
}

// AlertRepository defines data-access operations for alerts.
type AlertRepository interface {
	Create(userID string, input CreateAlertInput) (*models.Alert, error)
	GetByUserID(userID string) ([]models.Alert, error)
	Update(id, userID string, input UpdateAlertInput) (string, error)
	Delete(id, userID string) (bool, error)
	GetPriceContext(input PriceContextInput) (*PriceContextResult, error)
	GetMatchingStations(alertID, userID string) ([]MatchingStationResult, error)
}
