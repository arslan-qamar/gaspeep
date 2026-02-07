package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	DisplayName string  `json:"displayName"`
	PasswordHash string  `json:"-"`
	Tier      string    `json:"tier"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Station struct {
	ID              string         `json:"id"`
	Name            string         `json:"name"`
	Brand           string         `json:"brand"`
	Address         string         `json:"address"`
	Latitude        float64        `json:"latitude"`
	Longitude       float64        `json:"longitude"`
	OperatingHours  string         `json:"operatingHours"`
	Amenities       []string       `json:"amenities"`
	LastVerifiedAt  *time.Time     `json:"lastVerifiedAt"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	Prices          []FuelPriceData `json:"prices,omitempty"`
}

type FuelType struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	DisplayName  string `json:"displayName"`
	Description  string `json:"description"`
	ColorCode    string `json:"colorCode"`
	DisplayOrder int    `json:"displayOrder"`
}

type FuelPrice struct {
	ID                 string    `json:"id"`
	StationID          string    `json:"stationId"`
	FuelTypeID         string    `json:"fuelTypeId"`
	Price              float64   `json:"price"`
	Currency           string    `json:"currency"`
	Unit               string    `json:"unit"`
	LastUpdatedAt      *time.Time `json:"lastUpdatedAt"`
	VerificationStatus string    `json:"verificationStatus"`
	ConfirmationCount  int       `json:"confirmationCount"`
}

type PriceSubmission struct {
	ID                     string    `json:"id"`
	UserID                 string    `json:"userId"`
	StationID              string    `json:"stationId"`
	FuelTypeID             string    `json:"fuelTypeId"`
	Price                  float64   `json:"price"`
	SubmissionMethod       string    `json:"submissionMethod"`
	SubmittedAt            time.Time `json:"submittedAt"`
	ModerationStatus       string    `json:"moderationStatus"`
	VerificationConfidence float32   `json:"verificationConfidence"`
	PhotoURL               string    `json:"photoUrl"`
	VoiceRecordingURL      string    `json:"voiceRecordingUrl"`
	OCRData                string    `json:"ocrData"`
	ModeratorNotes         string    `json:"moderatorNotes"`
}

type Alert struct {
	ID              string    `json:"id"`
	UserID          string    `json:"userId"`
	FuelTypeID      string    `json:"fuelTypeId"`
	PriceThreshold  float64   `json:"priceThreshold"`
	Latitude        float64   `json:"latitude"`
	Longitude       float64   `json:"longitude"`
	RadiusKm        int       `json:"radiusKm"`
	AlertName       string    `json:"alertName"`
	IsActive        bool      `json:"isActive"`
	CreatedAt       time.Time `json:"createdAt"`
	LastTriggeredAt *time.Time `json:"lastTriggeredAt"`
	TriggerCount    int       `json:"triggerCount"`
}

type Notification struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	NotificationType string  `json:"notificationType"`
	Title          string    `json:"title"`
	Message        string    `json:"message"`
	SentAt         time.Time `json:"sentAt"`
	IsRead         bool      `json:"isRead"`
	DeliveryStatus string    `json:"deliveryStatus"`
	ActionURL      string    `json:"actionUrl"`
	AlertID        *string   `json:"alertId"`
	BroadcastID    *string   `json:"broadcastId"`
}

type StationOwner struct {
	ID                   string     `json:"id"`
	UserID               string     `json:"userId"`
	BusinessName         string     `json:"businessName"`
	VerificationStatus   string     `json:"verificationStatus"`
	VerificationDocuments []string  `json:"verificationDocuments"`
	ContactInfo          string     `json:"contactInfo"`
	VerifiedAt           *time.Time `json:"verifiedAt"`
	CreatedAt            time.Time  `json:"createdAt"`
}

type Broadcast struct {
	ID               string    `json:"id"`
	StationOwnerID   string    `json:"stationOwnerId"`
	StationID        string    `json:"stationId"`
	Title            string    `json:"title"`
	Message          string    `json:"message"`
	TargetRadiusKm   int       `json:"targetRadiusKm"`
	StartDate        time.Time `json:"startDate"`
	EndDate          time.Time `json:"endDate"`
	BroadcastStatus  string    `json:"broadcastStatus"`
	TargetFuelTypes  []string  `json:"targetFuelTypes"`
	CreatedAt        time.Time `json:"createdAt"`
	Views            int       `json:"views"`
	Clicks           int       `json:"clicks"`
}

// FuelPriceData represents fuel price information for a station
type FuelPriceData struct {
	FuelTypeID   string    `json:"fuelTypeId" db:"fuel_type_id"`
	FuelTypeName string    `json:"fuelTypeName" db:"fuel_type_name"`
	Price        float64   `json:"price" db:"price"`
	Currency     string    `json:"currency" db:"currency"`
	LastUpdated  time.Time `json:"lastUpdated" db:"last_updated_at"`
	Verified     bool      `json:"verified" db:"verified"`
}

// StationsNearbyRequest represents the request payload for fetching nearby stations
type StationsNearbyRequest struct {
	Latitude  float64  `json:"latitude" binding:"required"`
	Longitude float64  `json:"longitude" binding:"required"`
	RadiusKm  int      `json:"radiusKm" binding:"required,min=1,max=50"`
	FuelTypes []string `json:"fuelTypes"`
	MaxPrice  float64  `json:"maxPrice"`
}
