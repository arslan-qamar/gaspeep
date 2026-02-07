package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/lib/pq"
	"gaspeep/backend/internal/models"
)

type StationRepository struct {
	db *sql.DB
}

func NewStationRepository(db *sql.DB) *StationRepository {
	return &StationRepository{db: db}
}

// GetStationsNearby returns stations within radius with fuel prices
func (r *StationRepository) GetStationsNearby(
	lat, lon float64,
	radiusKm int,
	fuelTypes []string,
	maxPrice float64,
) ([]models.Station, error) {
	query := `
		SELECT 
			s.id, s.name, s.brand, s.address,
			ST_Y(s.coordinates::geometry) as latitude,
			ST_X(s.coordinates::geometry) as longitude,
			s.operating_hours, s.amenities, s.last_verified_at,
			fp.fuel_type_id, ft.name as fuel_type_name, fp.price, fp.currency, fp.last_updated_at,
			CASE WHEN fp.verification_status = 'verified' THEN true ELSE false END as verified
		FROM stations s
		LEFT JOIN fuel_prices fp ON s.id = fp.station_id
		LEFT JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE ST_DWithin(
			s.coordinates::geography, 
			ST_MakePoint($1, $2)::geography, 
			$3 * 1000
		)
	`

	args := []interface{}{lon, lat, radiusKm}
	argIndex := 4

	if len(fuelTypes) > 0 {
		query += fmt.Sprintf(` AND fp.fuel_type_id = ANY($%d)`, argIndex)
		args = append(args, pq.Array(fuelTypes))
		argIndex++
	}

	if maxPrice > 0 {
		query += fmt.Sprintf(` AND fp.price <= $%d`, argIndex)
		args = append(args, maxPrice)
	}

	query += ` ORDER BY ST_Distance(s.coordinates::geography, ST_MakePoint($1, $2)::geography)`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query stations: %w", err)
	}
	defer rows.Close()

	stationsMap := make(map[string]*models.Station)

	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			lat, lon                                 float64
			amenities                                pq.StringArray
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
			var lastVerifiedPtr *sql.NullTime
			if lastVerified.Valid {
				lastVerifiedPtr = &lastVerified
			}

			stationsMap[id] = &models.Station{
				ID:             id,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      amenities,
				LastVerifiedAt: nil,
				Prices:         []models.FuelPriceData{},
			}

			if lastVerifiedPtr != nil && lastVerifiedPtr.Valid {
				stationsMap[id].LastVerifiedAt = &lastVerifiedPtr.Time
			}
		}

		if fuelTypeID.Valid && price.Valid {
			stationsMap[id].Prices = append(stationsMap[id].Prices, models.FuelPriceData{
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

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	return result, nil
}

// GetStationByID returns a single station with prices
func (r *StationRepository) GetStationByID(id string) (*models.Station, error) {
	query := `
		SELECT 
			s.id, s.name, s.brand, s.address,
			ST_Y(s.coordinates::geometry) as latitude,
			ST_X(s.coordinates::geometry) as longitude,
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
			amenities                                       pq.StringArray
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
			var lastVerifiedPtr *sql.NullTime
			if lastVerified.Valid {
				lastVerifiedPtr = &lastVerified
			}

			station = &models.Station{
				ID:             stationID,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      amenities,
				LastVerifiedAt: nil,
				Prices:         []models.FuelPriceData{},
			}

			if lastVerifiedPtr != nil && lastVerifiedPtr.Valid {
				station.LastVerifiedAt = &lastVerifiedPtr.Time
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

// SearchStations searches by name or address
func (r *StationRepository) SearchStations(searchQuery string, limit int) ([]models.Station, error) {
	query := `
		SELECT 
			s.id, s.name, s.brand, s.address,
			ST_Y(s.coordinates::geometry) as latitude,
			ST_X(s.coordinates::geometry) as longitude,
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
			amenities                                pq.StringArray
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
			var lastVerifiedPtr *sql.NullTime
			if lastVerified.Valid {
				lastVerifiedPtr = &lastVerified
			}

			stationsMap[id] = &models.Station{
				ID:             id,
				Name:           name,
				Brand:          brand,
				Address:        address,
				Latitude:       lat,
				Longitude:      lon,
				OperatingHours: operatingHours,
				Amenities:      amenities,
				LastVerifiedAt: nil,
				Prices:         []models.FuelPriceData{},
			}

			if lastVerifiedPtr != nil && lastVerifiedPtr.Valid {
				stationsMap[id].LastVerifiedAt = &lastVerifiedPtr.Time
			}
		}

		if fuelTypeID.Valid && price.Valid {
			stationsMap[id].Prices = append(stationsMap[id].Prices, models.FuelPriceData{
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

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	return result, nil
}
