package repository

import (
	"time"
)

// FuelPriceResult represents a fuel price with optional location data.
type FuelPriceResult struct {
	ID                 string     `json:"id"`
	StationID          string     `json:"stationId"`
	FuelTypeID         string     `json:"fuelTypeId"`
	Price              float64    `json:"price"`
	Currency           string     `json:"currency"`
	Unit               string     `json:"unit"`
	LastUpdatedAt      *time.Time `json:"lastUpdatedAt"`
	VerificationStatus string     `json:"verificationStatus"`
	ConfirmationCount  int        `json:"confirmationCount"`
	DistanceKm         *float64   `json:"distanceKm,omitempty"`
}

// StationPriceResult represents a fuel price with fuel type details.
type StationPriceResult struct {
	ID                  string     `json:"id"`
	StationID           string     `json:"stationId"`
	FuelTypeID          string     `json:"fuelTypeId"`
	Price               float64    `json:"price"`
	Currency            string     `json:"currency"`
	Unit                string     `json:"unit"`
	LastUpdatedAt       *time.Time `json:"lastUpdatedAt"`
	VerificationStatus  string     `json:"verificationStatus"`
	ConfirmationCount   int        `json:"confirmationCount"`
	FuelTypeName        string     `json:"fuelTypeName"`
	FuelTypeDisplayName string     `json:"fuelTypeDisplayName"`
	FuelTypeColorCode   string     `json:"fuelTypeColorCode"`
}

// CheapestPriceResult represents the cheapest price for a fuel type within a radius.
type CheapestPriceResult struct {
	ID                 string     `json:"id"`
	StationID          string     `json:"stationId"`
	FuelTypeID         string     `json:"fuelTypeId"`
	Price              float64    `json:"price"`
	Currency           string     `json:"currency"`
	Unit               string     `json:"unit"`
	LastUpdatedAt      *time.Time `json:"lastUpdatedAt"`
	VerificationStatus string     `json:"verificationStatus"`
	ConfirmationCount  int        `json:"confirmationCount"`
	StationName        string     `json:"stationName"`
	StationBrand       string     `json:"stationBrand"`
	Latitude           float64    `json:"latitude"`
	Longitude          float64    `json:"longitude"`
	DistanceKm         float64    `json:"distanceKm"`
	FuelTypeName       string     `json:"fuelTypeName"`
}

// FuelPriceFilters holds optional filters for fuel price queries.
type FuelPriceFilters struct {
	StationID  string
	FuelTypeID string
	Lat        float64
	Lon        float64
	RadiusKm   float64
	MinPrice   string
	MaxPrice   string
}

// FuelPriceRepository defines data-access operations for fuel prices.
type FuelPriceRepository interface {
	GetFuelPrices(filters FuelPriceFilters) ([]FuelPriceResult, error)
	GetStationPrices(stationID string) ([]StationPriceResult, error)
	GetCheapestPrices(lat, lon, radiusKm float64) ([]CheapestPriceResult, error)
	UpsertFuelPrice(stationID, fuelTypeID string, price float64) error
	StationExists(stationID string) (bool, error)
	FuelTypeExists(fuelTypeID string) (bool, error)
}

// PriceSubmissionWithDetails holds a price submission with joined details.
type PriceSubmissionWithDetails struct {
	ID                     string     `json:"id"`
	UserID                 string     `json:"userId"`
	StationID              string     `json:"stationId"`
	FuelTypeID             string     `json:"fuelTypeId"`
	Price                  float64    `json:"price"`
	SubmissionMethod       string     `json:"submissionMethod"`
	SubmittedAt            time.Time  `json:"submittedAt"`
	ModerationStatus       string     `json:"moderationStatus"`
	VerificationConfidence float64    `json:"verificationConfidence"`
	PhotoURL               *string    `json:"photoUrl,omitempty"`
	VoiceRecordingURL      *string    `json:"voiceRecordingUrl,omitempty"`
	OCRData                *string    `json:"ocrData,omitempty"`
	ModeratorNotes         *string    `json:"moderatorNotes,omitempty"`
	StationName            string     `json:"stationName,omitempty"`
	StationBrand           string     `json:"stationBrand,omitempty"`
	FuelTypeName           string     `json:"fuelTypeName,omitempty"`
	UserDisplayName        string     `json:"userDisplayName,omitempty"`
}

// PriceSubmissionResult holds a newly created submission.
type PriceSubmissionResult struct {
	ID                     string    `json:"id"`
	UserID                 string    `json:"userId"`
	StationID              string    `json:"stationId"`
	FuelTypeID             string    `json:"fuelTypeId"`
	Price                  float64   `json:"price"`
	SubmissionMethod       string    `json:"submissionMethod"`
	SubmittedAt            time.Time `json:"submittedAt"`
	ModerationStatus       string    `json:"moderationStatus"`
	VerificationConfidence float64   `json:"verificationConfidence"`
	PhotoURL               *string   `json:"photoUrl"`
	VoiceRecordingURL      *string   `json:"voiceRecordingUrl"`
	OCRData                *string   `json:"ocrData"`
}

// CreateSubmissionInput holds parameters for creating a price submission.
type CreateSubmissionInput struct {
	UserID            string
	StationID         string
	FuelTypeID        string
	Price             float64
	SubmissionMethod  string
	Confidence        float64
	PhotoURL          string
	VoiceRecordingURL string
	OCRData           string
}

// SubmissionDetails holds the key fields from a submission for moderation.
type SubmissionDetails struct {
	StationID  string
	FuelTypeID string
	Price      float64
}

// PriceSubmissionRepository defines data-access operations for price submissions.
type PriceSubmissionRepository interface {
	Create(input CreateSubmissionInput) (*PriceSubmissionResult, error)
	GetByUserID(userID string, limit, offset int) ([]PriceSubmissionWithDetails, int, error)
	GetModerationQueue(status string, limit, offset int) ([]PriceSubmissionWithDetails, int, error)
	GetSubmissionDetails(id string) (*SubmissionDetails, error)
	UpdateModerationStatus(id, status, notes string) (bool, error)
	AutoApprove(id string) error
}
