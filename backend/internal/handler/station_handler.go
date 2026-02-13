package handler

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"gaspeep/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type StationHandler struct {
	db *sql.DB
}

func NewStationHandler(db *sql.DB) *StationHandler {
	return &StationHandler{db: db}
}

// GetStations retrieves stations with optional geospatial filtering
func (h *StationHandler) GetStations(c *gin.Context) {
	lat := c.Query("lat")
	lon := c.Query("lon")
	radius := c.Query("radius") // in kilometers
	fuelTypeID := c.Query("fuelTypeId")

	var query string
	var args []interface{}
	argIndex := 1

	if lat != "" && lon != "" && radius != "" {
		// Geospatial query using PostGIS
		latitude, _ := strconv.ParseFloat(lat, 64)
		longitude, _ := strconv.ParseFloat(lon, 64)
		radiusKm, _ := strconv.ParseFloat(radius, 64)

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

		args = append(args, longitude, latitude)
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
			args = append(args, fuelTypeID, radiusKm*1000) // Convert km to meters
		} else {
			query += `
			WHERE ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$` + strconv.Itoa(argIndex) + `
			)`
			args = append(args, radiusKm*1000) // Convert km to meters
		}

		query += ` ORDER BY distance_km LIMIT 100`
	} else {
		// Simple query without geospatial filtering
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

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stations"})
		return
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

		// Add distance_km if present in result
		if lat != "" && lon != "" && radius != "" {
			scanArgs = append(scanArgs, &distanceKm)
		}

		if err := rows.Scan(scanArgs...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan station"})
			return
		}

		// Parse amenities from JSONB
		if amenitiesJSON != nil {
			// Handle PostgreSQL array
			s.Amenities = []string{}
		} else {
			s.Amenities = []string{}
		}

		stations = append(stations, s)
	}

	c.JSON(http.StatusOK, stations)
}

// GetStation retrieves a single station by ID
func (h *StationHandler) GetStation(c *gin.Context) {
	id := c.Param("id")

	var s models.Station
	var amenitiesJSON interface{}

	query := `
		SELECT id, name, brand, address, 
			ST_Y(location::geometry) as latitude, 
			ST_X(location::geometry) as longitude,
			operating_hours, amenities, last_verified_at, created_at, updated_at
		FROM stations
		WHERE id = $1`

	err := h.db.QueryRow(query, id).Scan(
		&s.ID, &s.Name, &s.Brand, &s.Address,
		&s.Latitude, &s.Longitude, &s.OperatingHours,
		&amenitiesJSON, &s.LastVerifiedAt, &s.CreatedAt, &s.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Station not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch station"})
		return
	}

	// Parse amenities
	s.Amenities = []string{}

	c.JSON(http.StatusOK, s)
}

// CreateStation creates a new station
func (h *StationHandler) CreateStation(c *gin.Context) {
	var input struct {
		Name           string   `json:"name" binding:"required"`
		Brand          string   `json:"brand" binding:"required"`
		Address        string   `json:"address" binding:"required"`
		Latitude       float64  `json:"latitude" binding:"required"`
		Longitude      float64  `json:"longitude" binding:"required"`
		OperatingHours string   `json:"operatingHours"`
		Amenities      []string `json:"amenities"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate coordinates
	if input.Latitude < -90 || input.Latitude > 90 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}
	if input.Longitude < -180 || input.Longitude > 180 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	id := uuid.New().String()

	query := `
		INSERT INTO stations (id, name, brand, address, location, operating_hours, amenities)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8)
		RETURNING id, name, brand, address, ST_Y(location::geometry), ST_X(location::geometry), 
			operating_hours, amenities, last_verified_at, created_at, updated_at`

	var s models.Station
	var amenitiesJSON interface{}

	err := h.db.QueryRow(
		query,
		id, input.Name, input.Brand, input.Address,
		input.Longitude, input.Latitude,
		input.OperatingHours, "[]",
	).Scan(
		&s.ID, &s.Name, &s.Brand, &s.Address,
		&s.Latitude, &s.Longitude, &s.OperatingHours,
		&amenitiesJSON, &s.LastVerifiedAt, &s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create station"})
		return
	}

	s.Amenities = input.Amenities

	c.JSON(http.StatusCreated, s)
}

// UpdateStation updates an existing station
func (h *StationHandler) UpdateStation(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Name           string   `json:"name"`
		Brand          string   `json:"brand"`
		Address        string   `json:"address"`
		Latitude       float64  `json:"latitude"`
		Longitude      float64  `json:"longitude"`
		OperatingHours string   `json:"operatingHours"`
		Amenities      []string `json:"amenities"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE stations
		SET name = $1, brand = $2, address = $3, 
			location = ST_SetSRID(ST_MakePoint($4, $5), 4326),
			operating_hours = $6, updated_at = NOW()
		WHERE id = $7`

	result, err := h.db.Exec(
		query,
		input.Name, input.Brand, input.Address,
		input.Longitude, input.Latitude,
		input.OperatingHours, id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update station"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Station not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Station updated successfully"})
}

// DeleteStation deletes a station
func (h *StationHandler) DeleteStation(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM stations WHERE id = $1`
	result, err := h.db.Exec(query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete station"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Station not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Station deleted successfully"})
}

// GetStationsNearby handles POST /api/stations/nearby with fuel price filtering
func (h *StationHandler) GetStationsNearby(c *gin.Context) {
	var req struct {
		Latitude  float64  `json:"latitude" binding:"required"`
		Longitude float64  `json:"longitude" binding:"required"`
		RadiusKm  int      `json:"radiusKm" binding:"required,min=1,max=50"`
		FuelTypes []string `json:"fuelTypes"`
		MaxPrice  float64  `json:"maxPrice"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameters: " + err.Error()})
		return
	}

	// Build query with fuel prices
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

	args := []interface{}{req.Longitude, req.Latitude, req.RadiusKm}
	argIndex := 4

	if len(req.FuelTypes) > 0 {
		var uuidVals []string
		var nameVals []string
		for _, ft := range req.FuelTypes {
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

	if req.MaxPrice > 0 {
		query += ` AND fp.price <= $` + strconv.Itoa(argIndex)
		args = append(args, req.MaxPrice)
	}

	query += ` ORDER BY ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stations: " + err.Error()})
		return
	}
	defer rows.Close()

	// Group results by station ID
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan station row: " + err.Error()})
			return
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
				Amenities:      []string{},
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

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	c.JSON(http.StatusOK, result)
}

// SearchStations handles GET /api/stations/search
func (h *StationHandler) SearchStations(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	searchPattern := "%" + query + "%"
	limit := 20

	sqlQuery := `
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

	rows, err := h.db.Query(sqlQuery, searchPattern, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed: " + err.Error()})
		return
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan station row: " + err.Error()})
			return
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
				Amenities:      []string{},
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

	result := make([]models.Station, 0, len(stationsMap))
	for _, station := range stationsMap {
		result = append(result, *station)
	}

	c.JSON(http.StatusOK, result)
}
