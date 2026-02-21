package repository

import (
	"database/sql"
	"testing"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetStations_NoFilters tests retrieving all stations without filters
func TestGetStations_NoFilters(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	testhelpers.CreateTestStation(t, db, -33.9000, 151.2300)

	repo := NewPgStationRepository(db)
	results, err := repo.GetStations(0, 0, 0, "")

	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 2)
}

// TestGetStations_WithGeospatialFiltering tests retrieving stations within a radius
func TestGetStations_WithGeospatialFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Station 1km away (should be included)
	s1 := testhelpers.CreateTestStation(t, db, -33.8650, 151.2100)

	// Station 50km away (should be excluded)
	_ = testhelpers.CreateTestStation(t, db, -34.0000, 151.5000)

	repo := NewPgStationRepository(db)
	results, err := repo.GetStations(centerLat, centerLon, 10, "")

	require.NoError(t, err)
	require.Len(t, results, 1, "Should only return station within 10km")
	assert.Equal(t, s1.ID, results[0].ID)
}

// TestGetStationsNearby_RadiusFiltering tests distance-based filtering
func TestGetStationsNearby_RadiusFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create 3 stations at different distances
	s1 := testhelpers.CreateTestStation(t, db, -33.8650, 151.2100) // ~1km
	_ = testhelpers.CreateTestStation(t, db, -33.8750, 151.2050)   // >2km
	_ = testhelpers.CreateTestStation(t, db, -33.8750, 151.2000)   // ~3km

	repo := NewPgStationRepository(db)

	// Test with 2km radius - should get s1 only
	results, err := repo.GetStationsNearby(centerLat, centerLon, 2, nil, 0)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, s1.ID, results[0].ID)

	// Test with 5km radius - should get s1, s2, s3
	results, err = repo.GetStationsNearby(centerLat, centerLon, 5, nil, 0)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 3, "Should include all 3 stations within 5km")
}

// TestGetStationByID_Success tests retrieving a station by ID
func TestGetStationByID_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationRepository(db)
	result, err := repo.GetStationByID(station.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, station.ID, result.ID)
	assert.Equal(t, station.Name, result.Name)
	assert.Equal(t, station.Brand, result.Brand)
	assert.Equal(t, station.Latitude, result.Latitude)
	assert.Equal(t, station.Longitude, result.Longitude)
}

// TestGetStationByID_NotFound tests retrieving a non-existent station
func TestGetStationByID_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgStationRepository(db)
	result, err := repo.GetStationByID("00000000-0000-0000-0000-000000000000")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, sql.ErrNoRows, err)
}

// TestGetStationByID_WithFuelPrices tests that fuel prices are included
func TestGetStationByID_WithFuelPrices(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	fuelType1 := testhelpers.CreateTestFuelType(t, db, "E10")
	fuelType2 := testhelpers.CreateTestFuelType(t, db, "Diesel")

	testhelpers.CreateTestFuelPrice(t, db, station.ID, fuelType1, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, station.ID, fuelType2, 1.75)

	repo := NewPgStationRepository(db)
	result, err := repo.GetStationByID(station.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)
	require.Len(t, result.Prices, 2)

	// Verify prices are populated
	priceMap := make(map[string]float64)
	for _, p := range result.Prices {
		priceMap[p.FuelTypeName] = p.Price
	}
	assert.Equal(t, 1.55, priceMap["E10"])
	assert.Equal(t, 1.75, priceMap["Diesel"])
}

// TestCreateStation_ValidData tests creating a new station
func TestCreateStation_ValidData(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgStationRepository(db)
	input := CreateStationInput{
		Name:           "New Test Station",
		Brand:          "Shell",
		Address:        "123 Test St, Sydney",
		Latitude:       -33.8568,
		Longitude:      151.2153,
		OperatingHours: "24/7",
		Amenities:      []string{"car_wash", "convenience_store"},
	}

	station, err := repo.CreateStation(input)

	require.NoError(t, err)
	assert.NotNil(t, station)
	assert.NotEmpty(t, station.ID)
	assert.Equal(t, input.Name, station.Name)
	assert.Equal(t, input.Brand, station.Brand)
	assert.Equal(t, input.Latitude, station.Latitude)
	assert.Equal(t, input.Longitude, station.Longitude)
	assert.Equal(t, input.OperatingHours, station.OperatingHours)
	assert.ElementsMatch(t, input.Amenities, station.Amenities)

	// Verify it was actually inserted by fetching it
	fetched, err := repo.GetStationByID(station.ID)
	require.NoError(t, err)
	assert.Equal(t, station.ID, fetched.ID)
}

// TestUpdateStation_Success tests updating a station
func TestUpdateStation_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationRepository(db)
	input := UpdateStationInput{
		Name:           "Updated Station Name",
		Brand:          "NewBrand",
		Address:        "456 Updated St",
		Latitude:       -33.9000,
		Longitude:      151.2500,
		OperatingHours: "9AM-6PM",
	}

	updated, err := repo.UpdateStation(station.ID, input)

	require.NoError(t, err)
	assert.True(t, updated)

	// Verify update
	fetched, err := repo.GetStationByID(station.ID)
	require.NoError(t, err)
	assert.Equal(t, input.Name, fetched.Name)
	assert.Equal(t, input.Brand, fetched.Brand)
	assert.Equal(t, input.Address, fetched.Address)
}

// TestUpdateStation_NotFound tests updating a non-existent station
func TestUpdateStation_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgStationRepository(db)
	input := UpdateStationInput{Name: "Updated"}

	updated, err := repo.UpdateStation("00000000-0000-0000-0000-000000000000", input)

	require.NoError(t, err)
	assert.False(t, updated)
}

// TestDeleteStation_Success tests deleting a station
func TestDeleteStation_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationRepository(db)
	deleted, err := repo.DeleteStation(station.ID)

	require.NoError(t, err)
	assert.True(t, deleted)

	// Verify deletion
	result, err := repo.GetStationByID(station.ID)
	require.Error(t, err)
	assert.Nil(t, result)
}

// TestDeleteStation_NotFound tests deleting a non-existent station
func TestDeleteStation_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgStationRepository(db)
	deleted, err := repo.DeleteStation("00000000-0000-0000-0000-000000000000")

	require.NoError(t, err)
	assert.False(t, deleted)
}

// TestSearchStations_ILIKEMatching tests case-insensitive search
func TestSearchStations_ILIKEMatching(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create stations with different names
	s1 := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	_, err := db.Exec("UPDATE stations SET name = $1 WHERE id = $2", "Shell Coles Express", s1.ID)
	require.NoError(t, err)

	s2 := testhelpers.CreateTestStation(t, db, -33.8600, 151.2200)
	_, err = db.Exec("UPDATE stations SET name = $1 WHERE id = $2", "7-Eleven Bondi", s2.ID)
	require.NoError(t, err)

	s3 := testhelpers.CreateTestStation(t, db, -33.8700, 151.2300)
	_, err = db.Exec("UPDATE stations SET address = $1 WHERE id = $2", "123 Shell Street", s3.ID)
	require.NoError(t, err)

	repo := NewPgStationRepository(db)

	// Test case-insensitive search
	results, err := repo.SearchStations("shell", 100)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 2, "Should find 'Shell' in name and 'Shell Street' in address")

	// Test partial match
	results, err = repo.SearchStations("bondi", 100)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)
}

// TestSearchStations_Limit tests result limit
func TestSearchStations_Limit(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create multiple stations with the same name pattern
	for i := 0; i < 5; i++ {
		testhelpers.CreateTestStation(t, db, -33.8568+float64(i)*0.01, 151.2153+float64(i)*0.01)
	}

	repo := NewPgStationRepository(db)
	results, err := repo.SearchStations("Test", 2)

	require.NoError(t, err)
	assert.LessOrEqual(t, len(results), 2, "Should respect limit parameter")
}

// TestGetStations_FuelTypeFiltering tests filtering by fuel type
func TestGetStations_FuelTypeFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create 2 stations
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)
	s2 := testhelpers.CreateTestStation(t, db, centerLat+0.02, centerLon)

	// Add E10 price to s1 only
	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, e10, 1.55)

	// Add Diesel price to both
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, diesel, 1.75)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, diesel, 1.80)

	repo := NewPgStationRepository(db)

	// Filter by E10
	results, err := repo.GetStations(centerLat, centerLon, 10, e10)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1, "Should include s1 with E10")

	// Filter by Diesel
	results, err = repo.GetStations(centerLat, centerLon, 10, diesel)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 2, "Should include both stations with Diesel")
}

// TestGetStationsNearby_MaxPriceFiltering tests filtering by max price
func TestGetStationsNearby_MaxPriceFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create stations with different prices
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)
	s2 := testhelpers.CreateTestStation(t, db, centerLat+0.02, centerLon)

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, fuelType, 1.45)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, fuelType, 1.65)

	repo := NewPgStationRepository(db)

	// Get nearby stations with max price of 1.50
	results, err := repo.GetStationsNearby(centerLat, centerLon, 10, []string{fuelType}, 1.50)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1, "Should include s1 with price <= 1.50")

	// Verify all returned results have price <= 1.50
	for _, station := range results {
		for _, price := range station.Prices {
			assert.LessOrEqual(t, price.Price, 1.50, "All prices should be <= max price")
		}
	}
}

// TestGetStationsNearby_MultipleFuelTypes tests filtering by multiple fuel types
func TestGetStationsNearby_MultipleFuelTypes(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create stations
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)

	// Add multiple fuel types
	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, e10, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, diesel, 1.75)

	repo := NewPgStationRepository(db)

	// Search for multiple fuel types
	results, err := repo.GetStationsNearby(centerLat, centerLon, 10, []string{e10, diesel}, 0)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(results), 1)

	// Verify station has prices for both fuel types
	station := results[0]
	assert.GreaterOrEqual(t, len(station.Prices), 2, "Station should have prices for multiple fuel types")
}

// TestSearchStationsNearby_ExcludesNonPositivePrices ensures search-nearby never returns price values <= 0.
func TestSearchStationsNearby_ExcludesNonPositivePrices(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create stations near the search center.
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)
	s2 := testhelpers.CreateTestStation(t, db, centerLat+0.02, centerLon)

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, fuelType, 0.00)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, fuelType, 1.59)

	repo := NewPgStationRepository(db)
	results, err := repo.SearchStationsNearby(centerLat, centerLon, 10, "", nil, 0)
	require.NoError(t, err)
	require.NotEmpty(t, results)

	positivePriceFound := false
	for _, station := range results {
		for _, price := range station.Prices {
			assert.Greater(t, price.Price, 0.0, "search-nearby should only return prices > 0.00")
			if price.Price > 0 {
				positivePriceFound = true
			}
		}
	}

	assert.True(t, positivePriceFound, "expected at least one positive price in search-nearby results")
}

// TestCreateStation_WithAmenities tests creating station with amenities
func TestCreateStation_WithAmenities(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgStationRepository(db)
	amenities := []string{"car_wash", "convenience_store", "restroom"}
	input := CreateStationInput{
		Name:      "Amenity Station",
		Brand:     "Brand",
		Address:   "123 St",
		Latitude:  -33.8568,
		Longitude: 151.2153,
		Amenities: amenities,
	}

	station, err := repo.CreateStation(input)
	require.NoError(t, err)

	// Verify amenities are stored
	assert.ElementsMatch(t, amenities, station.Amenities)

	// Verify they're persisted
	fetched, err := repo.GetStationByID(station.ID)
	require.NoError(t, err)
	assert.ElementsMatch(t, amenities, fetched.Amenities)
}

// TestGetStations_OrderedByDistance tests results are ordered by distance
func TestGetStations_OrderedByDistance(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create stations at increasing distances
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon) // ~1km
	_ = testhelpers.CreateTestStation(t, db, centerLat+0.02, centerLon)   // ~2km
	_ = testhelpers.CreateTestStation(t, db, centerLat+0.03, centerLon)   // ~3km

	repo := NewPgStationRepository(db)
	results, err := repo.GetStations(centerLat, centerLon, 10, "")

	require.NoError(t, err)
	require.GreaterOrEqual(t, len(results), 3)

	// Verify ordering - first should be s1 (closest)
	assert.Equal(t, s1.ID, results[0].ID, "Closest station should be first")
}

// TestSearchStations_NoResults tests search with no matches
func TestSearchStations_NoResults(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationRepository(db)
	results, err := repo.SearchStations("NonexistentSearchTerm12345", 100)

	require.NoError(t, err)
	assert.Empty(t, results)
}
