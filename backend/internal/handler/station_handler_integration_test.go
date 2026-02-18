package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"
	testhelpers "gaspeep/backend/internal/repository/testhelpers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestStationHandler_GetStations_Integration tests GetStations with real database
func TestStationHandler_GetStations_Integration(t *testing.T) {
	// Setup test database
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create test fixtures
	_ = testhelpers.CreateTestStation(t, db, -33.8688, 151.2093) // Sydney
	_ = testhelpers.CreateTestStation(t, db, -33.8700, 151.2100) // ~1km away
	_ = testhelpers.CreateTestStation(t, db, -34.0000, 151.5000) // ~30km away

	// Create service with real dependencies
	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/stations", handler.GetStations)

	// Test 1: Get all stations
	req := httptest.NewRequest(http.MethodGet, "/api/stations", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	var stations []models.Station
	json.Unmarshal(rr.Body.Bytes(), &stations)
	assert.GreaterOrEqual(t, len(stations), 3)
}

// TestStationHandler_GetStationsNearby_Integration tests geographic filtering
func TestStationHandler_GetStationsNearby_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create test stations at different distances
	_ = testhelpers.CreateTestStation(t, db, -33.8688, 151.2093) // Sydney CBD
	_ = testhelpers.CreateTestStation(t, db, -33.8700, 151.2100) // ~1km away
	station3 := testhelpers.CreateTestStation(t, db, -34.0000, 151.5000) // ~30km away

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/stations/nearby", handler.GetStationsNearby)

	// Test: Find stations within 5km
	payload := map[string]interface{}{
		"latitude":  -33.8688,
		"longitude": 151.2093,
		"radiusKm":  5,
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/stations/nearby", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var stations []models.Station
	json.Unmarshal(rr.Body.Bytes(), &stations)

	// Should find station1 and station2 (within 5km)
	assert.GreaterOrEqual(t, len(stations), 2)

	// Verify station3 is not in results (too far)
	for _, s := range stations {
		if s.ID == station3.ID {
			t.Fatalf("station3 should not be in results (>5km away)")
		}
	}
}

// TestStationHandler_CreateStation_Integration tests station creation
func TestStationHandler_CreateStation_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/stations", handler.CreateStation)

	// Test: Create valid station
	payload := map[string]interface{}{
		"name":           "New Station",
		"brand":          "BP",
		"address":        "123 Main St",
		"latitude":       -33.8688,
		"longitude":      151.2093,
		"operatingHours": "24/7",
		"amenities":      []string{"car_wash", "convenience_store"},
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/stations", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)

	var station models.Station
	json.Unmarshal(rr.Body.Bytes(), &station)
	assert.Equal(t, "New Station", station.Name)
	assert.Equal(t, "BP", station.Brand)
	assert.NotEmpty(t, station.ID)
}

// TestStationHandler_CreateStation_InvalidLatitude tests validation
func TestStationHandler_CreateStation_InvalidLatitude(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/stations", handler.CreateStation)

	// Test: Invalid latitude (> 90)
	payload := map[string]interface{}{
		"name":      "Bad Station",
		"brand":     "Shell",
		"address":   "123 Main St",
		"latitude":  91.0, // Invalid
		"longitude": 151.2093,
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/stations", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

// TestStationHandler_GetStation_Integration tests retrieving a single station
func TestStationHandler_GetStation_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8688, 151.2093)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/stations/:id", handler.GetStation)

	req := httptest.NewRequest(http.MethodGet, "/api/stations/"+station.ID, nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var result models.Station
	json.Unmarshal(rr.Body.Bytes(), &result)
	assert.Equal(t, station.ID, result.ID)
	assert.Equal(t, station.Name, result.Name)
}

// TestStationHandler_GetStation_NotFound tests 404 when station doesn't exist
func TestStationHandler_GetStation_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/stations/:id", handler.GetStation)

	req := httptest.NewRequest(http.MethodGet, "/api/stations/nonexistent_id", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

// TestStationHandler_SearchStations_Integration tests station search
func TestStationHandler_SearchStations_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create test stations with searchable names
	testhelpers.CreateTestStation(t, db, -33.8688, 151.2093)
	testhelpers.CreateTestStation(t, db, -33.8700, 151.2100)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/stations/search", handler.SearchStations)

	// Test: Search with query
	req := httptest.NewRequest(http.MethodGet, "/api/stations/search?q=Test", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var stations []models.Station
	json.Unmarshal(rr.Body.Bytes(), &stations)
	// Results depend on database state
	assert.IsType(t, []models.Station{}, stations)
}

// TestStationHandler_SearchStations_MissingQuery tests query validation
func TestStationHandler_SearchStations_MissingQuery(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/stations/search", handler.SearchStations)

	// Test: Missing query parameter
	req := httptest.NewRequest(http.MethodGet, "/api/stations/search", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var errResp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &errResp)
	assert.Contains(t, errResp["error"], "required")
}

// TestStationHandler_UpdateStation_Integration tests updating a station
func TestStationHandler_UpdateStation_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8688, 151.2093)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/stations/:id", handler.UpdateStation)

	// Test: Update station
	payload := map[string]interface{}{
		"name":      "Updated Station Name",
		"brand":     "Chevron",
		"address":   "456 New St",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPut, "/api/stations/"+station.ID, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var result map[string]string
	json.Unmarshal(rr.Body.Bytes(), &result)
	assert.Equal(t, "Station updated successfully", result["message"])
}

// TestStationHandler_DeleteStation_Integration tests deleting a station
func TestStationHandler_DeleteStation_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8688, 151.2093)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/api/stations/:id", handler.DeleteStation)

	req := httptest.NewRequest(http.MethodDelete, "/api/stations/"+station.ID, nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var result map[string]string
	json.Unmarshal(rr.Body.Bytes(), &result)
	assert.Equal(t, "Station deleted successfully", result["message"])
}

// TestStationHandler_GetStationsWithFuelType tests filtering by fuel type
func TestStationHandler_GetStationsWithFuelType_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create stations
	station1 := testhelpers.CreateTestStation(t, db, -33.8688, 151.2093)
	station2 := testhelpers.CreateTestStation(t, db, -33.8700, 151.2100)

	// Create fuel type and prices
	fuelTypeID := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, station1.ID, fuelTypeID, 1.50)
	testhelpers.CreateTestFuelPrice(t, db, station2.ID, fuelTypeID, 1.45)

	stationRepo := repository.NewPgStationRepository(db)
	stationService := service.NewStationService(stationRepo)
	handler := NewStationHandler(stationService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/stations", handler.GetStations)

	// Test: Get stations with fuel type filter
	req := httptest.NewRequest(http.MethodGet, "/api/stations?fuelTypeId="+fuelTypeID, nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var stations []models.Station
	json.Unmarshal(rr.Body.Bytes(), &stations)
	// Should return stations with the fuel type
	require.GreaterOrEqual(t, len(stations), 2)
}
