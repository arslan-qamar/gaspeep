package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"gaspeep/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// PgStationRepository is the PostgreSQL implementation of StationRepository.
type PgStationRepository struct {
	db *sql.DB
}

func NewPgStationRepository(db *sql.DB) *PgStationRepository {
	return &PgStationRepository{db: db}
}

func parseAmenities(raw interface{}) []string {
	if raw == nil {
		return []string{}
	}

	var data []byte
	switch v := raw.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return []string{}
	}

	var amenities []string
	if err := json.Unmarshal(data, &amenities); err != nil {
		return []string{}
	}
	return amenities
}

// GetStations retrieves stations with optional geospatial and fuel-type filtering.
func (r *PgStationRepository) GetStations(lat, lon, radiusKm float64, fuelTypeID string) ([]models.Station, error) {
	var query string
	var args []interface{}
	argIndex := 1

	hasGeo := lat != 0 || lon != 0 || radiusKm != 0

	if hasGeo {
		query = `
			SELECT DISTINCT s.id, s.name, s.brand, s.address,
				ST_Y(s.location::geometry) as latitude,
				ST_X(s.location::geometry) as longitude,
				s.operating_hours, s.amenities, s.last_verified_at, s.created_at, s.updated_at,
				ST_Distance(
					s.location::geography,
					ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
				) / 1000 as distance_km
			FROM stations s`

		args = append(args, lon, lat)
		argIndex = 3

		if fuelTypeID != "" {
			query += `
			INNER JOIN fuel_prices fp ON s.id = fp.station_id
			WHERE fp.fuel_type_id = $` + strconv.Itoa(argIndex) + `
			AND ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$` + strconv.Itoa(argIndex+1) + `
			)`
			args = append(args, fuelTypeID, radiusKm*1000)
		} else {
			query += `
			WHERE ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$` + strconv.Itoa(argIndex) + `
			)`
			args = append(args, radiusKm*1000)
		}

		query += ` ORDER BY distance_km LIMIT 100`
	} else {
		query = `
			SELECT s.id, s.name, s.brand, s.address,
				ST_Y(s.location::geometry) as latitude,
				ST_X(s.location::geometry) as longitude,
				s.operating_hours, s.amenities, s.last_verified_at, s.created_at, s.updated_at
			FROM stations s`

		if fuelTypeID != "" {
			query += `
			INNER JOIN fuel_prices fp ON s.id = fp.station_id
			WHERE fp.fuel_type_id = $1`
			args = append(args, fuelTypeID)
		}

		query += ` ORDER BY s.name LIMIT 100`
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query stations: %w", err)
	}
	defer rows.Close()

	stations := []models.Station{}
	for rows.Next() {
		var s models.Station
		var amenitiesJSON interface{}
		var distanceKm *float64

		scanArgs := []interface{}{
			&s.ID, &s.Name, &s.Brand, &s.Address,
			&s.Latitude, &s.Longitude, &s.OperatingHours,
			&amenitiesJSON, &s.LastVerifiedAt, &s.CreatedAt, &s.UpdatedAt,
		}

		if hasGeo {
			scanArgs = append(scanArgs, &distanceKm)
		}

		if err := rows.Scan(scanArgs...); err != nil {
			return nil, fmt.Errorf("failed to scan station: %w", err)
		}

		s.Amenities = parseAmenities(amenitiesJSON)
		stations = append(stations, s)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	return stations, nil
}

// GetStationByID returns a single station with its fuel prices.
func (r *PgStationRepository) GetStationByID(id string) (*models.Station, error) {
	if _, err := uuid.Parse(id); err != nil {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT
			s.id, s.name, s.brand, s.address,
			ST_Y(s.location::geometry) as latitude,
			ST_X(s.location::geometry) as longitude,
			s.operating_hours, s.amenities, s.last_verified_at,
			fp.fuel_type_id, ft.name as fuel_type_name, fp.price, fp.currency, fp.last_updated_at,
			CASE WHEN fp.verification_status = 'verified' THEN true ELSE false END as verified
		FROM stations s
		LEFT JOIN fuel_prices fp ON s.id = fp.station_id
		LEFT JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE s.id = $1
	`

	rows, err := r.db.Query(query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query station: %w", err)
	}
	defer rows.Close()

	var station *models.Station

	for rows.Next() {
		var (
			stationID, name, brand, address, operatingHours string
			lat, lon                                        float64
			amenities                                       interface{}
			lastVerified                                    sql.NullTime
			fuelTypeID                                      sql.NullString
			fuelTypeName, currency                          sql.NullString
			price                                           sql.NullFloat64
			lastUpdated                                     sql.NullTime
			verified                                        sql.NullBool
		)

		err := rows.Scan(
			&stationID, &name, &brand, &address, &lat, &lon,
			&operatingHours, &amenities, &lastVerified,
			&fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verified,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan station row: %w", err)
		}

		if station == nil {
			station = &models.Station{
				ID:             stationID,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      parseAmenities(amenities),
				Prices:         []models.FuelPriceData{},
			}

			if lastVerified.Valid {
				station.LastVerifiedAt = &lastVerified.Time
			}
		}

		if fuelTypeID.Valid && price.Valid {
			station.Prices = append(station.Prices, models.FuelPriceData{
				FuelTypeID:   fuelTypeID.String,
				FuelTypeName: fuelTypeName.String,
				Price:        price.Float64,
				Currency:     currency.String,
				LastUpdated:  lastUpdated.Time,
				Verified:     verified.Bool,
			})
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	if station == nil {
		return nil, sql.ErrNoRows
	}

	return station, nil
}

// CreateStation inserts a new station and returns it.
func (r *PgStationRepository) CreateStation(input CreateStationInput) (*models.Station, error) {
	id := uuid.New().String()

	query := `
		INSERT INTO stations (id, name, brand, address, location, latitude, longitude, operating_hours, amenities)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $6, $5, $7, $8)
		RETURNING id, name, brand, address, ST_Y(location::geometry), ST_X(location::geometry),
			operating_hours, amenities, last_verified_at, created_at, updated_at`

	var s models.Station
	var amenitiesJSON interface{}
	var lastVerified sql.NullTime
	amenitiesPayload, _ := json.Marshal(input.Amenities)

	err := r.db.QueryRow(
		query,
		id, input.Name, input.Brand, input.Address,
		input.Longitude, input.Latitude,
		input.OperatingHours, amenitiesPayload,
	).Scan(
		&s.ID, &s.Name, &s.Brand, &s.Address,
		&s.Latitude, &s.Longitude, &s.OperatingHours,
		&amenitiesJSON, &lastVerified, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create station: %w", err)
	}

	if lastVerified.Valid {
		s.LastVerifiedAt = &lastVerified.Time
	}
	s.Amenities = parseAmenities(amenitiesJSON)
	return &s, nil
}

// UpdateStation updates an existing station. Returns true if a row was updated.
func (r *PgStationRepository) UpdateStation(id string, input UpdateStationInput) (bool, error) {
	query := `
		UPDATE stations
		SET name = $1, brand = $2, address = $3,
			location = ST_SetSRID(ST_MakePoint($4, $5), 4326),
			operating_hours = $6, updated_at = NOW()
		WHERE id = $7`

	result, err := r.db.Exec(
		query,
		input.Name, input.Brand, input.Address,
		input.Longitude, input.Latitude,
		input.OperatingHours, id,
	)
	if err != nil {
		return false, fmt.Errorf("failed to update station: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	return rowsAffected > 0, nil
}

// DeleteStation deletes a station by ID. Returns true if a row was deleted.
func (r *PgStationRepository) DeleteStation(id string) (bool, error) {
	result, err := r.db.Exec(`DELETE FROM stations WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("failed to delete station: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	return rowsAffected > 0, nil
}

// GetStationsNearby returns stations within radius with fuel prices, optionally filtered by name/address.
func (r *PgStationRepository) GetStationsNearby(
	lat, lon float64,
	radiusKm int,
	fuelTypes []string,
	maxPrice float64,
) ([]models.Station, error) {
	query := `
		SELECT
			s.id, s.name, s.brand, s.address,
			ST_Y(s.location::geometry) as latitude,
			ST_X(s.location::geometry) as longitude,
			s.operating_hours, s.amenities, s.last_verified_at,
			fp.fuel_type_id, ft.name as fuel_type_name, fp.price, fp.currency, fp.last_updated_at,
			CASE WHEN fp.verification_status = 'verified' THEN true ELSE false END as verified
		FROM stations s
		LEFT JOIN fuel_prices fp ON s.id = fp.station_id
		LEFT JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE ST_DWithin(
			s.location::geography,
			ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
			$3 * 1000
		)
	`

	args := []interface{}{lon, lat, radiusKm}
	argIndex := 4

	if len(fuelTypes) > 0 {
		var uuidVals []string
		var nameVals []string
		for _, ft := range fuelTypes {
			if _, err := uuid.Parse(ft); err == nil {
				uuidVals = append(uuidVals, ft)
			} else {
				nameVals = append(nameVals, strings.ToUpper(ft))
			}
		}

		if len(uuidVals) > 0 && len(nameVals) > 0 {
			query += ` AND (fp.fuel_type_id = ANY($` + strconv.Itoa(argIndex) + `::uuid[]) OR UPPER(ft.name) = ANY($` + strconv.Itoa(argIndex+1) + `))`
			args = append(args, pq.Array(uuidVals), pq.Array(nameVals))
			argIndex += 2
		} else if len(uuidVals) > 0 {
			query += ` AND fp.fuel_type_id = ANY($` + strconv.Itoa(argIndex) + `::uuid[])`
			args = append(args, pq.Array(uuidVals))
			argIndex++
		} else {
			query += ` AND UPPER(ft.name) = ANY($` + strconv.Itoa(argIndex) + `)`
			args = append(args, pq.Array(nameVals))
			argIndex++
		}
	}

	if maxPrice > 0 {
		query += ` AND fp.price <= $` + strconv.Itoa(argIndex)
		args = append(args, maxPrice)
	}

	query += ` ORDER BY ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query nearby stations: %w", err)
	}
	defer rows.Close()

	stationsMap := make(map[string]*models.Station)

	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			lat, lon                                 float64
			amenities                                interface{}
			lastVerified                             sql.NullTime
			fuelTypeID                               sql.NullString
			fuelTypeName, currency                   sql.NullString
			price                                    sql.NullFloat64
			lastUpdated                              sql.NullTime
			verified                                 sql.NullBool
		)

		err := rows.Scan(
			&id, &name, &brand, &address, &lat, &lon,
			&operatingHours, &amenities, &lastVerified,
			&fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verified,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan station row: %w", err)
		}

		if _, exists := stationsMap[id]; !exists {
			stationsMap[id] = &models.Station{
				ID:             id,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      parseAmenities(amenities),
				Prices:         []models.FuelPriceData{},
			}

			if lastVerified.Valid {
				stationsMap[id].LastVerifiedAt = &lastVerified.Time
			}
		}

		if fuelTypeID.Valid && price.Valid {
			priceData := models.FuelPriceData{
				FuelTypeID:   fuelTypeID.String,
				FuelTypeName: fuelTypeName.String,
				Price:        price.Float64,
				Currency:     currency.String,
				Verified:     verified.Bool,
			}
			if lastUpdated.Valid {
				priceData.LastUpdated = lastUpdated.Time
			}
			stationsMap[id].Prices = append(stationsMap[id].Prices, priceData)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	return result, nil
}

// SearchStationsNearby searches within a geographic radius with optional name/address search and fuel type/price filtering.
// If searchQuery is empty, returns all nearby stations. If searchQuery is provided, filters by name/address.
func (r *PgStationRepository) SearchStationsNearby(
	lat, lon float64,
	radiusKm int,
	searchQuery string,
	fuelTypes []string,
	brands []string,
	maxPrice float64,
) ([]models.Station, error) {
	query := `
		SELECT
			s.id, s.name, s.brand, s.address,
			ST_Y(s.location::geometry) as latitude,
			ST_X(s.location::geometry) as longitude,
			s.operating_hours, s.amenities, s.last_verified_at,
			fp.fuel_type_id, ft.name as fuel_type_name, fp.price, fp.currency, fp.last_updated_at,
			CASE WHEN fp.verification_status = 'verified' THEN true ELSE false END as verified
		FROM stations s
		LEFT JOIN fuel_prices fp ON s.id = fp.station_id AND fp.price > 0
		LEFT JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE ST_DWithin(
			s.location::geography,
			ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
			$3 * 1000
		)
	`

	args := []interface{}{lon, lat, radiusKm}
	argIndex := 4

	// Add name/address search filter if query is provided
	if strings.TrimSpace(searchQuery) != "" {
		query += `
		AND (s.name ILIKE $4 OR s.address ILIKE $4)
	`
		args = append(args, "%"+strings.TrimSpace(searchQuery)+"%")
		argIndex = 5
	}

	if len(fuelTypes) > 0 {
		var uuidVals []string
		var nameVals []string
		for _, ft := range fuelTypes {
			if _, err := uuid.Parse(ft); err == nil {
				uuidVals = append(uuidVals, ft)
			} else {
				nameVals = append(nameVals, strings.ToUpper(ft))
			}
		}

		if len(uuidVals) > 0 && len(nameVals) > 0 {
			query += ` AND (fp.fuel_type_id = ANY($` + strconv.Itoa(argIndex) + `::uuid[]) OR UPPER(ft.name) = ANY($` + strconv.Itoa(argIndex+1) + `))`
			args = append(args, pq.Array(uuidVals), pq.Array(nameVals))
			argIndex += 2
		} else if len(uuidVals) > 0 {
			query += ` AND fp.fuel_type_id = ANY($` + strconv.Itoa(argIndex) + `::uuid[])`
			args = append(args, pq.Array(uuidVals))
			argIndex++
		} else {
			query += ` AND UPPER(ft.name) = ANY($` + strconv.Itoa(argIndex) + `)`
			args = append(args, pq.Array(nameVals))
			argIndex++
		}
	}

	if len(brands) > 0 {
		normalizedBrands := make([]string, 0, len(brands))
		for _, brand := range brands {
			trimmedBrand := strings.ToUpper(strings.TrimSpace(brand))
			if trimmedBrand != "" {
				normalizedBrands = append(normalizedBrands, trimmedBrand)
			}
		}
		if len(normalizedBrands) > 0 {
			query += ` AND UPPER(TRIM(s.brand)) = ANY($` + strconv.Itoa(argIndex) + `)`
			args = append(args, pq.Array(normalizedBrands))
			argIndex++
		}
	}

	if maxPrice > 0 {
		query += ` AND fp.price <= $` + strconv.Itoa(argIndex)
		args = append(args, maxPrice)
	}

	query += ` ORDER BY ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography), s.name`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search nearby stations: %w", err)
	}
	defer rows.Close()

	stationsMap := make(map[string]*models.Station)

	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			lat, lon                                 float64
			amenities                                interface{}
			lastVerified                             sql.NullTime
			fuelTypeID                               sql.NullString
			fuelTypeName, currency                   sql.NullString
			price                                    sql.NullFloat64
			lastUpdated                              sql.NullTime
			verified                                 sql.NullBool
		)

		err := rows.Scan(
			&id, &name, &brand, &address, &lat, &lon,
			&operatingHours, &amenities, &lastVerified,
			&fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verified,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan station row: %w", err)
		}

		if _, exists := stationsMap[id]; !exists {
			stationsMap[id] = &models.Station{
				ID:             id,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      parseAmenities(amenities),
				Prices:         []models.FuelPriceData{},
			}

			if lastVerified.Valid {
				stationsMap[id].LastVerifiedAt = &lastVerified.Time
			}
		}

		if fuelTypeID.Valid && price.Valid {
			priceData := models.FuelPriceData{
				FuelTypeID:   fuelTypeID.String,
				FuelTypeName: fuelTypeName.String,
				Price:        price.Float64,
				Currency:     currency.String,
				Verified:     verified.Bool,
			}
			if lastUpdated.Valid {
				priceData.LastUpdated = lastUpdated.Time
			}
			stationsMap[id].Prices = append(stationsMap[id].Prices, priceData)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	return result, nil
}

// SearchStations searches by name or address.
func (r *PgStationRepository) SearchStations(searchQuery string, limit int) ([]models.Station, error) {
	query := `
		SELECT
			s.id, s.name, s.brand, s.address,
			ST_Y(s.location::geometry) as latitude,
			ST_X(s.location::geometry) as longitude,
			s.operating_hours, s.amenities, s.last_verified_at,
			fp.fuel_type_id, ft.name as fuel_type_name, fp.price, fp.currency, fp.last_updated_at,
			CASE WHEN fp.verification_status = 'verified' THEN true ELSE false END as verified
		FROM stations s
		LEFT JOIN fuel_prices fp ON s.id = fp.station_id
		LEFT JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE s.name ILIKE $1 OR s.address ILIKE $1
		ORDER BY s.name
		LIMIT $2
	`

	searchPattern := "%" + strings.TrimSpace(searchQuery) + "%"
	rows, err := r.db.Query(query, searchPattern, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search stations: %w", err)
	}
	defer rows.Close()

	stationsMap := make(map[string]*models.Station)

	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			lat, lon                                 float64
			amenities                                interface{}
			lastVerified                             sql.NullTime
			fuelTypeID                               sql.NullString
			fuelTypeName, currency                   sql.NullString
			price                                    sql.NullFloat64
			lastUpdated                              sql.NullTime
			verified                                 sql.NullBool
		)

		err := rows.Scan(
			&id, &name, &brand, &address, &lat, &lon,
			&operatingHours, &amenities, &lastVerified,
			&fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verified,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan station row: %w", err)
		}

		if _, exists := stationsMap[id]; !exists {
			stationsMap[id] = &models.Station{
				ID:             id,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      parseAmenities(amenities),
				Prices:         []models.FuelPriceData{},
			}

			if lastVerified.Valid {
				stationsMap[id].LastVerifiedAt = &lastVerified.Time
			}
		}

		if fuelTypeID.Valid && price.Valid {
			priceData := models.FuelPriceData{
				FuelTypeID:   fuelTypeID.String,
				FuelTypeName: fuelTypeName.String,
				Price:        price.Float64,
				Currency:     currency.String,
				Verified:     verified.Bool,
			}
			if lastUpdated.Valid {
				priceData.LastUpdated = lastUpdated.Time
			}
			stationsMap[id].Prices = append(stationsMap[id].Prices, priceData)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	return result, nil
}
