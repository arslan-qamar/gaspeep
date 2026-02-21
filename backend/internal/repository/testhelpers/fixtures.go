package testhelpers

import (
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"gaspeep/backend/internal/models"
	"github.com/google/uuid"
)

// CreateTestUser creates a test user with sensible defaults
func CreateTestUser(t *testing.T, db *sql.DB) *models.User {
	id := uuid.New().String()
	email := "test-" + id + "@example.com"
	displayName := "Test User " + id[:8]
	tier := "free"

	user := &models.User{
		ID:          id,
		Email:       email,
		DisplayName: displayName,
		Tier:        tier,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Insert into database
	err := db.QueryRow(`
		INSERT INTO users (id, email, password_hash, display_name, tier, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, email, display_name, tier, created_at, updated_at
	`, id, email, "hashed_password", displayName, tier).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	return user
}

// CreateTestFuelType creates a test fuel type
func CreateTestFuelType(t *testing.T, db *sql.DB, name string) string {
	id := uuid.New().String()

	displayName := name

	colorCode := "#1ABC9C"
	if name == "Diesel" {
		colorCode = "#3498DB"
	} else if name == "LPG" {
		colorCode = "#E74C3C"
	}

	err := db.QueryRow(`
		INSERT INTO fuel_types (id, name, display_name, color_code, display_order)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (name) DO UPDATE
		SET display_name = EXCLUDED.display_name,
		    color_code = EXCLUDED.color_code
		RETURNING id
	`, id, name, displayName, colorCode, 0).Scan(&id)

	if err != nil {
		t.Fatalf("Failed to create test fuel type: %v", err)
	}

	return id
}

// CreateTestStation creates a test station at the given coordinates
func CreateTestStation(t *testing.T, db *sql.DB, latitude, longitude float64) *models.Station {
	id := uuid.New().String()
	name := "Test Station " + id[:8]
	brand := "TestBrand"
	address := "123 Test Street, Test City"
	operatingHours := "24/7"
	amenities := []string{"car_wash", "convenience_store"}

	// Convert amenities to JSON
	amenitiesJSON, _ := json.Marshal(amenities)

	station := &models.Station{
		ID:             id,
		Name:           name,
		Brand:          brand,
		Address:        address,
		Latitude:       latitude,
		Longitude:      longitude,
		OperatingHours: operatingHours,
		Amenities:      amenities,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Use ST_MakePoint to create PostGIS point (lon, lat order)
	// The stations table has both location (GEOGRAPHY) and latitude/longitude columns
	var scanAmenities []byte
	err := db.QueryRow(`
		INSERT INTO stations (id, name, brand, address, location, latitude, longitude, operating_hours, amenities, created_at, updated_at)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $6, $5, $7, $8, NOW(), NOW())
		RETURNING id, name, brand, address, latitude, longitude,
		          operating_hours, amenities, created_at, updated_at
	`, id, name, brand, address, longitude, latitude, operatingHours, amenitiesJSON).Scan(
		&station.ID, &station.Name, &station.Brand, &station.Address, &station.Latitude, &station.Longitude,
		&station.OperatingHours, &scanAmenities, &station.CreatedAt, &station.UpdatedAt,
	)

	if err != nil {
		t.Fatalf("Failed to create test station: %v", err)
	}

	// Unmarshal amenities
	_ = json.Unmarshal(scanAmenities, &station.Amenities)

	return station
}

// CreateTestFuelPrice creates a test fuel price for a station
func CreateTestFuelPrice(t *testing.T, db *sql.DB, stationID, fuelTypeID string, price float64) string {
	id := uuid.New().String()
	currency := "AUD"
	unit := "L"
	verificationStatus := "verified"

	_, err := db.Exec(`
		INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, verification_status, last_updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		ON CONFLICT (station_id, fuel_type_id) DO UPDATE
		SET price = $4, last_updated_at = NOW(), confirmation_count = fuel_prices.confirmation_count + 1
	`, id, stationID, fuelTypeID, price, currency, unit, verificationStatus)

	if err != nil {
		t.Fatalf("Failed to create test fuel price: %v", err)
	}

	return id
}

// CreateTestAlert creates a test alert
func CreateTestAlert(t *testing.T, db *sql.DB, userID string, latitude, longitude float64) *models.Alert {
	id := uuid.New().String()
	fuelTypeID := CreateTestFuelType(t, db, "E10")
	priceThreshold := 1.50
	radiusKm := 10
	alertName := "Test Alert"
	isActive := true

	alert := &models.Alert{
		ID:             id,
		UserID:         userID,
		FuelTypeID:     fuelTypeID,
		PriceThreshold: priceThreshold,
		Latitude:       latitude,
		Longitude:      longitude,
		RadiusKm:       radiusKm,
		AlertName:      alertName,
		RecurrenceType: "recurring",
		IsActive:       isActive,
		CreatedAt:      time.Now(),
	}

	err := db.QueryRow(`
		INSERT INTO alerts (id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, recurrence_type, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
		RETURNING id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, recurrence_type, is_active, created_at, last_triggered_at, trigger_count
	`, id, userID, fuelTypeID, priceThreshold, latitude, longitude, radiusKm, alertName, alert.RecurrenceType, isActive).Scan(
		&alert.ID, &alert.UserID, &alert.FuelTypeID, &alert.PriceThreshold,
		&alert.Latitude, &alert.Longitude, &alert.RadiusKm, &alert.AlertName,
		&alert.RecurrenceType, &alert.IsActive, &alert.CreatedAt, &alert.LastTriggeredAt, &alert.TriggerCount,
	)

	if err != nil {
		t.Fatalf("Failed to create test alert: %v", err)
	}

	return alert
}

// CreateTestStationOwner creates a test station owner
func CreateTestStationOwner(t *testing.T, db *sql.DB, userID string) *models.StationOwner {
	id := uuid.New().String()
	businessName := "Test Business " + id[:8]
	verificationStatus := "unverified"
	contactInfo := "contact@example.com"

	owner := &models.StationOwner{
		ID:                    id,
		UserID:                userID,
		BusinessName:          businessName,
		VerificationStatus:    verificationStatus,
		VerificationDocuments: []string{},
		ContactInfo:           &contactInfo,
		CreatedAt:             time.Now(),
	}

	err := db.QueryRow(`
		INSERT INTO station_owners (id, user_id, business_name, verification_status, contact_info, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, user_id, business_name, verification_status, contact_info, created_at, verified_at
	`, id, userID, businessName, verificationStatus, contactInfo).Scan(
		&owner.ID, &owner.UserID, &owner.BusinessName, &owner.VerificationStatus, &owner.ContactInfo, &owner.CreatedAt, &owner.VerifiedAt,
	)

	if err != nil {
		t.Fatalf("Failed to create test station owner: %v", err)
	}

	return owner
}

// CreateTestPasswordReset creates a test password reset token
func CreateTestPasswordReset(t *testing.T, db *sql.DB, userID string) string {
	id := uuid.New().String()
	expiresAt := time.Now().Add(1 * time.Hour)

	err := db.QueryRow(`
		INSERT INTO password_resets (id, user_id, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id
	`, id, userID, expiresAt).Scan(&id)

	if err != nil {
		t.Fatalf("Failed to create test password reset: %v", err)
	}

	return id
}

// CreateTestBroadcast creates a test broadcast
func CreateTestBroadcast(t *testing.T, db *sql.DB, stationOwnerID, stationID string) *models.Broadcast {
	id := uuid.New().String()
	title := "Test Broadcast"
	message := "Test message"
	targetRadiusKm := 5
	startDate := time.Now()
	endDate := time.Now().Add(7 * 24 * time.Hour)
	broadcastStatus := "scheduled"
	targetFuelTypes := []string{"E10", "Diesel"}

	targetFuelTypesJSON, _ := json.Marshal(targetFuelTypes)
	targetFuelTypesStr := string(targetFuelTypesJSON)

	broadcast := &models.Broadcast{
		ID:              id,
		StationOwnerID:  stationOwnerID,
		StationID:       stationID,
		Title:           title,
		Message:         message,
		TargetRadiusKm:  targetRadiusKm,
		StartDate:       startDate,
		EndDate:         endDate,
		BroadcastStatus: broadcastStatus,
		TargetFuelTypes: &targetFuelTypesStr,
		CreatedAt:       time.Now(),
		Views:           0,
		Clicks:          0,
	}

	err := db.QueryRow(`
		INSERT INTO broadcasts (id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 0, 0)
		RETURNING id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks
	`, id, stationOwnerID, stationID, title, message, targetRadiusKm, startDate, endDate, broadcastStatus, targetFuelTypesJSON).Scan(
		&broadcast.ID, &broadcast.StationOwnerID, &broadcast.StationID, &broadcast.Title, &broadcast.Message,
		&broadcast.TargetRadiusKm, &broadcast.StartDate, &broadcast.EndDate, &broadcast.BroadcastStatus, &targetFuelTypesJSON,
		&broadcast.CreatedAt, &broadcast.Views, &broadcast.Clicks,
	)

	if err != nil {
		t.Fatalf("Failed to create test broadcast: %v", err)
	}

	return broadcast
}
