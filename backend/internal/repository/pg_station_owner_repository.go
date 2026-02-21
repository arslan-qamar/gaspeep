package repository

import (
	"database/sql"
	"fmt"
	"time"

	"gaspeep/backend/internal/models"

	"github.com/google/uuid"
)

// PgStationOwnerRepository is the PostgreSQL implementation of StationOwnerRepository.
type PgStationOwnerRepository struct {
	db *sql.DB
}

func NewPgStationOwnerRepository(db *sql.DB) *PgStationOwnerRepository {
	return &PgStationOwnerRepository{db: db}
}

func (r *PgStationOwnerRepository) CreateVerificationRequest(userID string, input CreateOwnerVerificationInput) (*models.StationOwner, error) {
	id := uuid.New().String()
	query := `
		INSERT INTO station_owners (
			id, user_id, business_name, verification_status, verification_documents, contact_info, created_at
		) VALUES ($1, $2, $3, 'pending', $4, $5, NOW())
		RETURNING id, user_id, business_name, verification_status, verification_documents, contact_info, created_at, verified_at`

	var owner models.StationOwner
	var verDocs string
	var verifiedAt *time.Time

	err := r.db.QueryRow(query, id, userID, input.BusinessName, input.VerificationDocuments, input.ContactInfo).Scan(
		&owner.ID, &owner.UserID, &owner.BusinessName, &owner.VerificationStatus, &verDocs, &owner.ContactInfo, &owner.CreatedAt, &verifiedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create verification request: %w", err)
	}

	owner.VerificationDocuments = []string{verDocs}
	owner.VerifiedAt = verifiedAt

	return &owner, nil
}

func (r *PgStationOwnerRepository) GetStationsByOwnerUserID(userID string) ([]map[string]interface{}, error) {
	query := `
		SELECT s.id, s.name, s.brand, s.address, s.latitude, s.longitude, s.operating_hours, s.amenities, s.last_verified_at, cv.verification_status, cv.verified_at
		FROM stations s
		INNER JOIN station_owners so ON so.id = s.owner_id
		LEFT JOIN claim_verifications cv ON cv.station_id = s.id AND cv.station_owner_id = so.id
		WHERE so.user_id = $1
		ORDER BY s.created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query owner stations: %w", err)
	}
	defer rows.Close()

	var stations []map[string]interface{}
	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			verificationStatus                       *string
			latitude, longitude                      float64
			amenities                                interface{}
			lastVerifiedAt                           sql.NullTime
			verifiedAt                               *time.Time
		)

		if err := rows.Scan(&id, &name, &brand, &address, &latitude, &longitude, &operatingHours, &amenities, &lastVerifiedAt, &verificationStatus, &verifiedAt); err != nil {
			return nil, fmt.Errorf("failed to scan station: %w", err)
		}

		// Default to unverified if no claim verification exists
		status := "unverified"
		if verificationStatus != nil {
			status = *verificationStatus
		}

		parsedAmenities := []string{}
		if raw := parseAmenities(amenities); len(raw) > 0 {
			parsedAmenities = raw
		}

		var lastVerifiedAtValue interface{}
		if lastVerifiedAt.Valid {
			lastVerifiedAtValue = lastVerifiedAt.Time
		}

		station := map[string]interface{}{
			"id":                 id,
			"name":               name,
			"brand":              brand,
			"address":            address,
			"latitude":           latitude,
			"longitude":          longitude,
			"operatingHours":     operatingHours,
			"amenities":          parsedAmenities,
			"lastVerifiedAt":     lastVerifiedAtValue,
			"verificationStatus": status,
			"verifiedAt":         verifiedAt,
		}
		stations = append(stations, station)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	return stations, nil
}

func (r *PgStationOwnerRepository) GetByUserID(userID string) (*models.StationOwner, error) {
	query := `
		SELECT id, user_id, business_name, verification_status, contact_info,
		       contact_name, contact_email, contact_phone, plan,
		       created_at, verified_at
		FROM station_owners
		WHERE user_id = $1
		LIMIT 1`

	var owner models.StationOwner
	var verifiedAt *time.Time

	err := r.db.QueryRow(query, userID).Scan(
		&owner.ID,
		&owner.UserID,
		&owner.BusinessName,
		&owner.VerificationStatus,
		&owner.ContactInfo,
		&owner.ContactName,
		&owner.ContactEmail,
		&owner.ContactPhone,
		&owner.Plan,
		&owner.CreatedAt,
		&verifiedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("station owner not found")
		}
		return nil, fmt.Errorf("failed to query owner: %w", err)
	}

	owner.VerifiedAt = verifiedAt
	return &owner, nil
}

func (r *PgStationOwnerRepository) GetStationByID(userID, stationID string) (map[string]interface{}, error) {
	query := `
		SELECT s.id, s.name, s.brand, s.address, s.latitude, s.longitude, s.operating_hours, s.amenities, s.last_verified_at, cv.verification_status, cv.verified_at
		FROM stations s
		INNER JOIN station_owners so ON so.id = s.owner_id
		LEFT JOIN claim_verifications cv ON cv.station_id = s.id AND cv.station_owner_id = so.id
		WHERE so.user_id = $1 AND s.id = $2`

	var (
		id, name, brand, address, operatingHours string
		verificationStatus                       *string
		latitude, longitude                      float64
		amenities                                interface{}
		lastVerifiedAt                           sql.NullTime
		verifiedAt                               *time.Time
	)

	err := r.db.QueryRow(query, userID, stationID).Scan(
		&id, &name, &brand, &address, &latitude, &longitude, &operatingHours, &amenities, &lastVerifiedAt, &verificationStatus, &verifiedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("station not found")
		}
		return nil, fmt.Errorf("failed to query station: %w", err)
	}

	// Default to unverified if no claim verification exists
	status := "unverified"
	if verificationStatus != nil {
		status = *verificationStatus
	}

	parsedAmenities := []string{}
	if raw := parseAmenities(amenities); len(raw) > 0 {
		parsedAmenities = raw
	}

	var lastVerifiedAtValue interface{}
	if lastVerifiedAt.Valid {
		lastVerifiedAtValue = lastVerifiedAt.Time
	}

	station := map[string]interface{}{
		"id":                 id,
		"name":               name,
		"brand":              brand,
		"address":            address,
		"latitude":           latitude,
		"longitude":          longitude,
		"operatingHours":     operatingHours,
		"amenities":          parsedAmenities,
		"lastVerifiedAt":     lastVerifiedAtValue,
		"verificationStatus": status,
		"verifiedAt":         verifiedAt,
	}

	return station, nil
}

func (r *PgStationOwnerRepository) GetStationWithPrices(userID, stationID string) (map[string]interface{}, error) {
	// First get the station
	station, err := r.GetStationByID(userID, stationID)
	if err != nil {
		return nil, err
	}

	// Then get fuel prices for this station
	priceQuery := `
		SELECT fp.fuel_type_id, ft.name, fp.price, fp.currency, fp.last_updated_at, fp.verification_status
		FROM fuel_prices fp
		INNER JOIN fuel_types ft ON ft.id = fp.fuel_type_id
		WHERE fp.station_id = $1
		ORDER BY ft.display_order ASC`

	rows, err := r.db.Query(priceQuery, stationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query fuel prices: %w", err)
	}
	defer rows.Close()

	var prices []map[string]interface{}
	for rows.Next() {
		var (
			fuelTypeID, fuelTypeName, currency, verificationStatus string
			price                                                  float64
			lastUpdated                                            time.Time
		)

		if err := rows.Scan(&fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verificationStatus); err != nil {
			return nil, fmt.Errorf("failed to scan fuel price: %w", err)
		}

		prices = append(prices, map[string]interface{}{
			"fuelTypeId":         fuelTypeID,
			"fuelTypeName":       fuelTypeName,
			"price":              price,
			"currency":           currency,
			"lastUpdated":        lastUpdated,
			"verificationStatus": verificationStatus,
		})
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating price rows: %w", err)
	}

	station["fuelPrices"] = prices
	return station, nil
}

func (r *PgStationOwnerRepository) SearchAvailableStations(userID, query, lat, lon, radius string) ([]map[string]interface{}, error) {
	// Search for stations that:
	// 1. Are not owned by this user
	// 2. Match the search query (by name or brand)
	// 3. Are within the specified radius of the given coordinates
	// NOTE: Requires owner_id column in stations table (migration pending)

	searchQuery := `
		SELECT s.id, s.name, s.brand, s.address, s.latitude, s.longitude, s.operating_hours,
		       ST_DistanceSphere(ST_Point(s.longitude, s.latitude), ST_Point($1::float, $2::float)) / 1000 as distance_km
		FROM stations s
		WHERE s.owner_id IS NULL
		AND (s.name ILIKE $3 OR s.brand ILIKE $3)
		AND ST_DistanceSphere(ST_Point(s.longitude, s.latitude), ST_Point($1::float, $2::float)) / 1000 <= $4::int
		ORDER BY distance_km ASC
		LIMIT 50`

	rows, err := r.db.Query(searchQuery, lon, lat, "%"+query+"%", radius)
	if err != nil {
		return nil, fmt.Errorf("failed to search stations: %w", err)
	}
	defer rows.Close()

	var stations []map[string]interface{}
	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			latitude, longitude, distanceKm          float64
		)

		if err := rows.Scan(&id, &name, &brand, &address, &latitude, &longitude, &operatingHours, &distanceKm); err != nil {
			return nil, fmt.Errorf("failed to scan station: %w", err)
		}

		stations = append(stations, map[string]interface{}{
			"id":             id,
			"name":           name,
			"brand":          brand,
			"address":        address,
			"latitude":       latitude,
			"longitude":      longitude,
			"operatingHours": operatingHours,
			"distanceKm":     distanceKm,
		})
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	return stations, nil
}

func (r *PgStationOwnerRepository) ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error) {
	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Get or create station_owner record for user
	var ownerID string
	ownerQuery := `SELECT id FROM station_owners WHERE user_id = $1 LIMIT 1`
	err = tx.QueryRow(ownerQuery, userID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			// Create new station owner
			ownerID = uuid.New().String()
			createOwnerQuery := `
				INSERT INTO station_owners (id, user_id, business_name, verification_status, created_at)
				VALUES ($1, $2, '', 'unverified', NOW())
				RETURNING id`
			err = tx.QueryRow(createOwnerQuery, ownerID, userID).Scan(&ownerID)
			if err != nil {
				return nil, fmt.Errorf("failed to create station owner: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to get station owner: %w", err)
		}
	}

	// 2. Update station.owner_id and set verification_status to pending
	updateStationQuery := `
		UPDATE stations
		SET owner_id = $1, verification_status = 'pending'
		WHERE id = $2
		RETURNING id, name, address`

	var stationName, address string
	err = tx.QueryRow(updateStationQuery, ownerID, stationID).Scan(&stationID, &stationName, &address)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("station not found")
		}
		return nil, fmt.Errorf("failed to update station: %w", err)
	}

	// 3. Create claim_verification record
	verificationID := uuid.New().String()

	// Convert document URLs to JSON array format if provided
	var documentsJSON *string
	if len(documentUrls) > 0 {
		// Store as JSON array
		docs := "["
		for i, url := range documentUrls {
			if i > 0 {
				docs += ","
			}
			// Simple JSON encoding of URL string
			docs += "\"" + url + "\""
		}
		docs += "]"
		documentsJSON = &docs
	}

	createVerificationQuery := `
		INSERT INTO claim_verifications (
			id, station_id, station_owner_id, verification_method, verification_documents,
			phone_number, email, verification_status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
		RETURNING id, verification_status, created_at`

	var verificationStatus string
	var createdAt time.Time
	err = tx.QueryRow(
		createVerificationQuery,
		verificationID, stationID, ownerID,
		verificationMethod, documentsJSON,
		phoneNumber, email,
	).Scan(&verificationID, &verificationStatus, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create verification request: %w", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return map[string]interface{}{
		"id":                 verificationID,
		"stationId":          stationID,
		"stationName":        stationName,
		"ownerId":            ownerID,
		"verificationMethod": verificationMethod,
		"verificationStatus": verificationStatus,
		"createdAt":          createdAt,
	}, nil
}

func (r *PgStationOwnerRepository) GetFuelPricesForOwner(userID string) (map[string]interface{}, error) {
	// Get all fuel prices for all stations owned by this user
	query := `
		SELECT s.id, s.name, fp.fuel_type_id, ft.name, fp.price, fp.currency, fp.last_updated_at, fp.verification_status
		FROM fuel_prices fp
		INNER JOIN stations s ON s.id = fp.station_id
		INNER JOIN fuel_types ft ON ft.id = fp.fuel_type_id
		INNER JOIN station_owners so ON so.id = s.owner_id
		WHERE so.user_id = $1
		ORDER BY s.name ASC, ft.display_order ASC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query fuel prices: %w", err)
	}
	defer rows.Close()

	// Group prices by station
	pricesByStation := make(map[string][]map[string]interface{})

	for rows.Next() {
		var (
			stationID, stationName, fuelTypeID, fuelTypeName, currency, verificationStatus string
			price                                                                          float64
			lastUpdated                                                                    time.Time
		)

		if err := rows.Scan(&stationID, &stationName, &fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verificationStatus); err != nil {
			return nil, fmt.Errorf("failed to scan fuel price: %w", err)
		}

		priceData := map[string]interface{}{
			"fuelTypeId":         fuelTypeID,
			"fuelTypeName":       fuelTypeName,
			"price":              price,
			"currency":           currency,
			"lastUpdated":        lastUpdated,
			"verificationStatus": verificationStatus,
		}

		if _, exists := pricesByStation[stationID]; !exists {
			pricesByStation[stationID] = []map[string]interface{}{}
		}
		pricesByStation[stationID] = append(pricesByStation[stationID], priceData)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating price rows: %w", err)
	}

	return map[string]interface{}{
		"pricesByStation": pricesByStation,
	}, nil
}

// UnclaimStation removes the owner claim from a station by setting owner_id to NULL
func (r *PgStationOwnerRepository) UnclaimStation(userID, stationID string) error {
	query := `
		UPDATE stations
		SET owner_id = NULL
		WHERE id = $1 AND owner_id IN (
			SELECT so.id FROM station_owners so WHERE so.user_id = $2
		)`

	result, err := r.db.Exec(query, stationID, userID)
	if err != nil {
		return fmt.Errorf("failed to unclaim station: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("station not found or user is not the owner")
	}

	return nil
}

func (r *PgStationOwnerRepository) UpdateProfile(userID string, input UpdateOwnerProfileInput) (*models.StationOwner, error) {
	query := `
		UPDATE station_owners
		SET business_name  = $1,
		    contact_name   = $2,
		    contact_email  = $3,
		    contact_phone  = $4,
		    updated_at     = NOW()
		WHERE user_id = $5
		RETURNING id, user_id, business_name, verification_status, contact_info,
		          contact_name, contact_email, contact_phone, plan,
		          created_at, verified_at`

	var owner models.StationOwner
	var verifiedAt *time.Time

	err := r.db.QueryRow(
		query,
		input.BusinessName,
		input.ContactName,
		input.ContactEmail,
		input.ContactPhone,
		userID,
	).Scan(
		&owner.ID,
		&owner.UserID,
		&owner.BusinessName,
		&owner.VerificationStatus,
		&owner.ContactInfo,
		&owner.ContactName,
		&owner.ContactEmail,
		&owner.ContactPhone,
		&owner.Plan,
		&owner.CreatedAt,
		&verifiedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("station owner not found")
		}
		return nil, fmt.Errorf("failed to update owner profile: %w", err)
	}

	owner.VerifiedAt = verifiedAt
	return &owner, nil
}

var _ StationOwnerRepository = (*PgStationOwnerRepository)(nil)
