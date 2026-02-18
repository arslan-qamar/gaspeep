package service

import (
	"fmt"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// StationOwnerService defines business operations for station owners.
type StationOwnerService interface {
	// Profile & Verification
	VerifyOwnership(userID string, input repository.CreateOwnerVerificationInput) (*models.StationOwner, error)
	GetProfile(userID string) (map[string]interface{}, error)
	UpdateProfile(userID string, input repository.UpdateOwnerProfileInput) (map[string]interface{}, error)
	GetStats(userID string) (map[string]interface{}, error)

	// Stations
	GetStations(userID string) ([]map[string]interface{}, error)
	GetStationDetails(userID, stationID string) (map[string]interface{}, error)
	SearchAvailableStations(query, lat, lon, radius string) ([]map[string]interface{}, error)
	ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error)
	UpdateStation(userID, stationID string, data interface{}) (map[string]interface{}, error)
	SavePhotos(userID, stationID string, photoURLs []string) ([]string, error)
	UnclaimStation(userID, stationID string) error
	ReVerifyStation(userID, stationID string) (map[string]interface{}, error)

	// Fuel Prices
	GetFuelPrices(userID string) (map[string]interface{}, error)
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

func (s *stationOwnerService) GetProfile(userID string) (map[string]interface{}, error) {
	// Fetch owner profile from repository
	owner, err := s.stationOwnerRepo.GetByUserID(userID)

	// If owner doesn't exist, return a default profile instead of failing
	// This allows new users to view their profile and complete it later
	if err != nil {
		return map[string]interface{}{
			"userId":             userID,
			"businessName":       "",
			"contactName":        "",
			"email":              "",
			"phone":              "",
			"verificationStatus": "not_verified",
			"verifiedAt":         nil,
			"plan":               "basic",
			"accountCreatedAt":   nil,
			"broadcastsThisWeek": 0,
			"broadcastLimit":     20,
			"notice":             "Complete your business profile to start broadcasting",
		}, nil
	}

	// Safe dereference of nullable pointer fields
	contactName := ""
	if owner.ContactName != nil {
		contactName = *owner.ContactName
	}
	contactEmail := ""
	if owner.ContactEmail != nil {
		contactEmail = *owner.ContactEmail
	}
	contactPhone := ""
	if owner.ContactPhone != nil {
		contactPhone = *owner.ContactPhone
	}

	// TODO: Fetch additional fields from user table (email, contact info, etc.)
	// TODO: Calculate broadcasts this week and plan limits
	return map[string]interface{}{
		"id":                 owner.ID,
		"userId":             owner.UserID,
		"businessName":       owner.BusinessName,
		"contactName":        contactName,
		"email":              contactEmail,
		"phone":              contactPhone,
		"verificationStatus": owner.VerificationStatus,
		"verifiedAt":         owner.VerifiedAt,
		"plan":               owner.Plan,
		"accountCreatedAt":   owner.CreatedAt,
		"broadcastsThisWeek": 0, // TODO: Count from broadcasts table
		"broadcastLimit":     20, // TODO: Get from plan table
	}, nil
}

func (s *stationOwnerService) UpdateProfile(userID string, input repository.UpdateOwnerProfileInput) (map[string]interface{}, error) {
	owner, err := s.stationOwnerRepo.UpdateProfile(userID, input)
	if err != nil {
		return nil, err
	}

	// Safe dereference of nullable pointer fields
	contactName := ""
	if owner.ContactName != nil {
		contactName = *owner.ContactName
	}
	contactEmail := ""
	if owner.ContactEmail != nil {
		contactEmail = *owner.ContactEmail
	}
	contactPhone := ""
	if owner.ContactPhone != nil {
		contactPhone = *owner.ContactPhone
	}

	return map[string]interface{}{
		"id":                 owner.ID,
		"userId":             owner.UserID,
		"businessName":       owner.BusinessName,
		"contactName":        contactName,
		"email":              contactEmail,
		"phone":              contactPhone,
		"verificationStatus": owner.VerificationStatus,
		"verifiedAt":         owner.VerifiedAt,
		"plan":               owner.Plan,
		"accountCreatedAt":   owner.CreatedAt,
		"broadcastsThisWeek": 0,
		"broadcastLimit":     20,
	}, nil
}

func (s *stationOwnerService) GetStats(userID string) (map[string]interface{}, error) {
	// Calculate stats based on stations and broadcasts
	owner, _ := s.stationOwnerRepo.GetByUserID(userID)
	stations, _ := s.stationOwnerRepo.GetStationsByOwnerUserID(userID)

	verifiedCount := 0
	for _, station := range stations {
		if status, ok := station["verificationStatus"].(string); ok && status == "verified" {
			verifiedCount++
		}
	}

	plan := "basic"
	broadcastLimit := 20
	if owner != nil {
		plan = owner.Plan
	}

	return map[string]interface{}{
		"totalStations":        len(stations),
		"verifiedStations":     verifiedCount,
		"activeBroadcasts":     0, // TODO: fetch from broadcasts
		"totalReachThisMonth":  0, // TODO: calculate from broadcasts
		"averageEngagementRate": 0, // TODO: calculate from analytics
		"broadcastsThisWeek":   0, // TODO: count from broadcasts
		"broadcastLimit":       broadcastLimit, // TODO: get from plan table
		"plan":                 plan,
	}, nil
}

func (s *stationOwnerService) GetStations(userID string) ([]map[string]interface{}, error) {
	return s.stationOwnerRepo.GetStationsByOwnerUserID(userID)
}

func (s *stationOwnerService) GetStationDetails(userID, stationID string) (map[string]interface{}, error) {
	return s.stationOwnerRepo.GetStationWithPrices(userID, stationID)
}

func (s *stationOwnerService) SearchAvailableStations(query, lat, lon, radius string) ([]map[string]interface{}, error) {
	return s.stationOwnerRepo.SearchAvailableStations("", query, lat, lon, radius)
}

func (s *stationOwnerService) ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error) {
	return s.stationOwnerRepo.ClaimStation(userID, stationID, verificationMethod, documentUrls, phoneNumber, email)
}

func (s *stationOwnerService) UpdateStation(userID, stationID string, data interface{}) (map[string]interface{}, error) {
	// TODO: Implement in repository
	// Verify the station is owned by this user, then update fields
	// Can update: name, brand, address, operating_hours, amenities
	return map[string]interface{}{}, nil
}

func (s *stationOwnerService) SavePhotos(userID, stationID string, photoURLs []string) ([]string, error) {
	// TODO: Implement in repository
	// Store photo URLs in a station_photos table
	// Each photo should have: id, station_id, photo_url, created_at
	// Verify the station is owned by this user first
	return photoURLs, nil
}

func (s *stationOwnerService) UnclaimStation(userID, stationID string) error {
	// Verify ownership first
	station, err := s.stationOwnerRepo.GetStationByID(userID, stationID)
	if err != nil {
		return err
	}
	if station == nil {
		return fmt.Errorf("station not found or user is not the owner")
	}

	// Set station.owner_id to NULL
	if err := s.stationOwnerRepo.UnclaimStation(userID, stationID); err != nil {
		return err
	}

	// TODO: Create an audit log of the unclaim action

	return nil
}

func (s *stationOwnerService) ReVerifyStation(userID, stationID string) (map[string]interface{}, error) {
	// TODO: Implement in repository
	// Create a new verification request for annual renewal
	// Station should already be verified (verification_status = "verified")
	// Create a re_verification record and set status to "pending"
	return map[string]interface{}{}, nil
}

func (s *stationOwnerService) GetFuelPrices(userID string) (map[string]interface{}, error) {
	return s.stationOwnerRepo.GetFuelPricesForOwner(userID)
}
