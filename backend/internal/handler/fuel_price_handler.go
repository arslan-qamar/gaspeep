package handler

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gaspeep/backend/internal/models"
)

type FuelPriceHandler struct {
	db *sql.DB
}

func NewFuelPriceHandler(db *sql.DB) *FuelPriceHandler {
	return &FuelPriceHandler{db: db}
}

// GetFuelPrices retrieves fuel prices with optional filters
func (h *FuelPriceHandler) GetFuelPrices(c *gin.Context) {
	stationID := c.Query("stationId")
	fuelTypeID := c.Query("fuelTypeId")
	lat := c.Query("lat")
	lon := c.Query("lon")
	radius := c.Query("radius")
	minPrice := c.Query("minPrice")
	maxPrice := c.Query("maxPrice")
	
	var query string
	var args []interface{}
	argIndex := 1

	// Base query with JOIN to get station coordinates
	query = `
		SELECT fp.id, fp.station_id, fp.fuel_type_id, fp.price, fp.currency, fp.unit,
			fp.last_updated_at, fp.verification_status, fp.confirmation_count,
			s.latitude, s.longitude`
	
	if lat != "" && lon != "" {
		query += `,
			ST_Distance(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($` + strconv.Itoa(argIndex) + `, $` + strconv.Itoa(argIndex+1) + `), 4326)::geography
			) / 1000 as distance_km`
		longitude, _ := strconv.ParseFloat(lon, 64)
		latitude, _ := strconv.ParseFloat(lat, 64)
		args = append(args, longitude, latitude)
		argIndex += 2
	}
	
	query += `
		FROM fuel_prices fp
		INNER JOIN (
			SELECT id, 
				ST_Y(location::geometry) as latitude, 
				ST_X(location::geometry) as longitude,
				location
			FROM stations
		) s ON fp.station_id = s.id
		WHERE 1=1`
	
	// Apply filters
	if stationID != "" {
		query += ` AND fp.station_id = $` + strconv.Itoa(argIndex)
		args = append(args, stationID)
		argIndex++
	}
	
	if fuelTypeID != "" {
		query += ` AND fp.fuel_type_id = $` + strconv.Itoa(argIndex)
		args = append(args, fuelTypeID)
		argIndex++
	}
	
	if minPrice != "" {
		query += ` AND fp.price >= $` + strconv.Itoa(argIndex)
		args = append(args, minPrice)
		argIndex++
	}
	
	if maxPrice != "" {
		query += ` AND fp.price <= $` + strconv.Itoa(argIndex)
		args = append(args, maxPrice)
		argIndex++
	}
	
	// Geospatial filter
	if lat != "" && lon != "" && radius != "" {
		radiusKm, _ := strconv.ParseFloat(radius, 64)
		query += `
			AND ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$` + strconv.Itoa(argIndex) + `
			)`
		args = append(args, radiusKm*1000) // Convert km to meters
		argIndex++
	}
	
	// Only show verified or unverified prices (not rejected)
	query += ` AND fp.verification_status IN ('verified', 'unverified')`
	
	if lat != "" && lon != "" {
		query += ` ORDER BY distance_km`
	} else {
		query += ` ORDER BY fp.last_updated_at DESC`
	}
	
	query += ` LIMIT 500`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fuel prices"})
		return
	}
	defer rows.Close()

	prices := []map[string]interface{}{}
	for rows.Next() {
		var fp models.FuelPrice
		var stationLat, stationLon float64
		var distanceKm *float64
		
		scanArgs := []interface{}{
			&fp.ID, &fp.StationID, &fp.FuelTypeID, &fp.Price, &fp.Currency, &fp.Unit,
			&fp.LastUpdatedAt, &fp.VerificationStatus, &fp.ConfirmationCount,
			&stationLat, &stationLon,
		}
		
		if lat != "" && lon != "" {
			scanArgs = append(scanArgs, &distanceKm)
		}
		
		if err := rows.Scan(scanArgs...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan fuel price"})
			return
		}
		
		priceData := map[string]interface{}{
			"id":                 fp.ID,
			"stationId":          fp.StationID,
			"fuelTypeId":         fp.FuelTypeID,
			"price":              fp.Price,
			"currency":           fp.Currency,
			"unit":               fp.Unit,
			"lastUpdatedAt":      fp.LastUpdatedAt,
			"verificationStatus": fp.VerificationStatus,
			"confirmationCount":  fp.ConfirmationCount,
		}
		
		if distanceKm != nil {
			priceData["distanceKm"] = *distanceKm
		}
		
		prices = append(prices, priceData)
	}

	c.JSON(http.StatusOK, prices)
}

// GetStationPrices retrieves all fuel prices for a specific station
func (h *FuelPriceHandler) GetStationPrices(c *gin.Context) {
	stationID := c.Param("id")

	query := `
		SELECT fp.id, fp.station_id, fp.fuel_type_id, fp.price, fp.currency, fp.unit,
			fp.last_updated_at, fp.verification_status, fp.confirmation_count,
			ft.name, ft.display_name, ft.color_code
		FROM fuel_prices fp
		INNER JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE fp.station_id = $1
			AND fp.verification_status IN ('verified', 'unverified')
		ORDER BY ft.display_order`
	
	rows, err := h.db.Query(query, stationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch station prices"})
		return
	}
	defer rows.Close()

	prices := []map[string]interface{}{}
	for rows.Next() {
		var fp models.FuelPrice
		var fuelTypeName, fuelTypeDisplayName, fuelTypeColorCode string
		
		if err := rows.Scan(
			&fp.ID, &fp.StationID, &fp.FuelTypeID, &fp.Price, &fp.Currency, &fp.Unit,
			&fp.LastUpdatedAt, &fp.VerificationStatus, &fp.ConfirmationCount,
			&fuelTypeName, &fuelTypeDisplayName, &fuelTypeColorCode,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan fuel price"})
			return
		}
		
		priceData := map[string]interface{}{
			"id":                 fp.ID,
			"stationId":          fp.StationID,
			"fuelTypeId":         fp.FuelTypeID,
			"price":              fp.Price,
			"currency":           fp.Currency,
			"unit":               fp.Unit,
			"lastUpdatedAt":      fp.LastUpdatedAt,
			"verificationStatus": fp.VerificationStatus,
			"confirmationCount":  fp.ConfirmationCount,
			"fuelType": map[string]string{
				"name":        fuelTypeName,
				"displayName": fuelTypeDisplayName,
				"colorCode":   fuelTypeColorCode,
			},
		}
		
		prices = append(prices, priceData)
	}

	c.JSON(http.StatusOK, prices)
}

// GetCheapestPrices retrieves the cheapest price for each fuel type within a radius
func (h *FuelPriceHandler) GetCheapestPrices(c *gin.Context) {
	lat := c.Query("lat")
	lon := c.Query("lon")
	radius := c.Query("radius")
	
	if lat == "" || lon == "" || radius == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat, lon, and radius are required"})
		return
	}
	
	latitude, _ := strconv.ParseFloat(lat, 64)
	longitude, _ := strconv.ParseFloat(lon, 64)
	radiusKm, _ := strconv.ParseFloat(radius, 64)
	
	query := `
		WITH nearby_prices AS (
			SELECT fp.id, fp.station_id, fp.fuel_type_id, fp.price, fp.currency, fp.unit,
				fp.last_updated_at, fp.verification_status, fp.confirmation_count,
				s.name as station_name, s.brand as station_brand,
				ST_Y(s.location::geometry) as latitude, 
				ST_X(s.location::geometry) as longitude,
				ST_Distance(
					s.location::geography,
					ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
				) / 1000 as distance_km,
				ft.display_name as fuel_type_name
			FROM fuel_prices fp
			INNER JOIN stations s ON fp.station_id = s.id
			INNER JOIN fuel_types ft ON fp.fuel_type_id = ft.id
			WHERE ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$3
			)
			AND fp.verification_status = 'verified'
		),
		ranked_prices AS (
			SELECT *,
				ROW_NUMBER() OVER (PARTITION BY fuel_type_id ORDER BY price ASC, distance_km ASC) as rank
			FROM nearby_prices
		)
		SELECT id, station_id, fuel_type_id, price, currency, unit,
			last_updated_at, verification_status, confirmation_count,
			station_name, station_brand, latitude, longitude, distance_km, fuel_type_name
		FROM ranked_prices
		WHERE rank = 1
		ORDER BY fuel_type_id`
	
	rows, err := h.db.Query(query, longitude, latitude, radiusKm*1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cheapest prices"})
		return
	}
	defer rows.Close()

	prices := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, stationID, fuelTypeID, currency, unit, verificationStatus string
			stationName, stationBrand, fuelTypeName                       string
			price, latitude, longitude, distanceKm                        float64
			lastUpdatedAtNull                                             sql.NullTime
			confirmationCount                                             int
		)
		
		if err := rows.Scan(
			&id, &stationID, &fuelTypeID, &price, &currency, &unit,
			&lastUpdatedAtNull, &verificationStatus, &confirmationCount,
			&stationName, &stationBrand, &latitude, &longitude, &distanceKm, &fuelTypeName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan cheapest price"})
			return
		}
		
		var lastUpdatedAt *string
		if lastUpdatedAtNull.Valid {
			timeStr := lastUpdatedAtNull.Time.Format("2006-01-02T15:04:05Z")
			lastUpdatedAt = &timeStr
		}
		
		priceData := map[string]interface{}{
			"id":                 id,
			"stationId":          stationID,
			"fuelTypeId":         fuelTypeID,
			"price":              price,
			"currency":           currency,
			"unit":               unit,
			"lastUpdatedAt":      lastUpdatedAt,
			"verificationStatus": verificationStatus,
			"confirmationCount":  confirmationCount,
			"distanceKm":         distanceKm,
			"station": map[string]interface{}{
				"id":        stationID,
				"name":      stationName,
				"brand":     stationBrand,
				"latitude":  latitude,
				"longitude": longitude,
			},
			"fuelTypeName": fuelTypeName,
		}
		
		prices = append(prices, priceData)
	}

	c.JSON(http.StatusOK, prices)
}
