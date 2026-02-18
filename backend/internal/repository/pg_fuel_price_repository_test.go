package repository

import (
	"testing"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetFuelPrices_NoFilters tests retrieving all fuel prices
func TestGetFuelPrices_NoFilters(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, station.ID, fuelType, 1.55)

	repo := NewPgFuelPriceRepository(db)
	results, err := repo.GetFuelPrices(FuelPriceFilters{})

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)
}

// TestGetFuelPrices_RadiusFiltering tests filtering by geographic radius
func TestGetFuelPrices_RadiusFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Station 1km away
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)
	// Station 50km away
	s2 := testhelpers.CreateTestStation(t, db, centerLat+0.5, centerLon)

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, fuelType, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, fuelType, 1.45)

	repo := NewPgFuelPriceRepository(db)

	filters := FuelPriceFilters{
		Lat:      centerLat,
		Lon:      centerLon,
		RadiusKm: 10,
	}
	results, err := repo.GetFuelPrices(filters)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1, "Should return price from s1 within 10km")

	// Verify s1 is in results
	found := false
	for _, r := range results {
		if r.StationID == s1.ID {
			found = true
			break
		}
	}
	assert.True(t, found, "Station 1 should be in results")
}

// TestGetFuelPrices_PriceRangeFiltering tests filtering by min and max price
func TestGetFuelPrices_PriceRangeFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	// Create prices for same station/fuelType (will upsert to last value)
	testhelpers.CreateTestFuelPrice(t, db, station.ID, fuelType, 1.45)

	repo := NewPgFuelPriceRepository(db)

	// Filter by price range
	filters := FuelPriceFilters{
		FuelTypeID: fuelType,
		MinPrice:   "1.40",
		MaxPrice:   "1.50",
	}
	results, err := repo.GetFuelPrices(filters)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)
	assert.Equal(t, 1.45, results[0].Price)
}

// TestGetStationPrices_WithFuelTypeDetails tests retrieving prices for a station with fuel type details
func TestGetStationPrices_WithFuelTypeDetails(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")

	testhelpers.CreateTestFuelPrice(t, db, station.ID, e10, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, station.ID, diesel, 1.75)

	repo := NewPgFuelPriceRepository(db)
	results, err := repo.GetStationPrices(station.ID)

	require.NoError(t, err)
	assert.Len(t, results, 2)

	// Verify fuel type details are included
	for _, price := range results {
		assert.NotEmpty(t, price.FuelTypeName)
		assert.NotEmpty(t, price.FuelTypeDisplayName)
		assert.NotEmpty(t, price.FuelTypeColorCode)
	}

	// Verify specific prices
	priceMap := make(map[string]float64)
	for _, p := range results {
		priceMap[p.FuelTypeName] = p.Price
	}
	assert.Equal(t, 1.55, priceMap["E10"])
	assert.Equal(t, 1.75, priceMap["Diesel"])
}

// TestGetCheapestPrices_WithinRadius tests getting cheapest prices within a radius
func TestGetCheapestPrices_WithinRadius(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Station 1: 1km away, E10 $1.55
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)
	// Station 2: 2km away, E10 $1.45 (CHEAPEST)
	s2 := testhelpers.CreateTestStation(t, db, centerLat+0.02, centerLon)
	// Station 3: 3km away, E10 $1.60
	s3 := testhelpers.CreateTestStation(t, db, centerLat+0.03, centerLon)

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, fuelType, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, fuelType, 1.45)
	testhelpers.CreateTestFuelPrice(t, db, s3.ID, fuelType, 1.60)

	repo := NewPgFuelPriceRepository(db)
	results, err := repo.GetCheapestPrices(centerLat, centerLon, 10)

	require.NoError(t, err)
	require.GreaterOrEqual(t, len(results), 1, "Should return cheapest price per fuel type")

	// Find the E10 result
	var cheapestE10 *CheapestPriceResult
	for i := range results {
		if results[i].FuelTypeName == "E10" {
			cheapestE10 = &results[i]
			break
		}
	}

	require.NotNil(t, cheapestE10)
	assert.Equal(t, s2.ID, cheapestE10.StationID)
	assert.Equal(t, 1.45, cheapestE10.Price)
}

// TestGetCheapestPrices_MultipleFuelTypes tests cheapest prices for different fuel types
func TestGetCheapestPrices_MultipleFuelTypes(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Station with both fuel types
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon)

	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")

	testhelpers.CreateTestFuelPrice(t, db, s1.ID, e10, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, diesel, 1.75)

	repo := NewPgFuelPriceRepository(db)
	results, err := repo.GetCheapestPrices(centerLat, centerLon, 10)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 2, "Should return cheapest for each fuel type")

	// Verify both fuel types are present
	fuelTypeNames := make(map[string]bool)
	for _, r := range results {
		fuelTypeNames[r.FuelTypeName] = true
	}
	assert.True(t, fuelTypeNames["E10"])
	assert.True(t, fuelTypeNames["Diesel"])
}

// TestUpsertFuelPrice_Insert tests inserting a new fuel price
func TestUpsertFuelPrice_Insert(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgFuelPriceRepository(db)
	err := repo.UpsertFuelPrice(station.ID, fuelType, 1.55)

	require.NoError(t, err)

	// Verify inserted
	prices, err := repo.GetStationPrices(station.ID)
	require.NoError(t, err)
	assert.Len(t, prices, 1)
	assert.Equal(t, 1.55, prices[0].Price)
	assert.Equal(t, 1, prices[0].ConfirmationCount)
}

// TestUpsertFuelPrice_Update tests updating an existing fuel price
func TestUpsertFuelPrice_Update(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgFuelPriceRepository(db)

	// Initial insert
	err := repo.UpsertFuelPrice(station.ID, fuelType, 1.55)
	require.NoError(t, err)

	// Update (upsert with same station+fuelType)
	err = repo.UpsertFuelPrice(station.ID, fuelType, 1.60)
	require.NoError(t, err)

	// Verify updated price and incremented confirmation count
	prices, err := repo.GetStationPrices(station.ID)
	require.NoError(t, err)
	assert.Len(t, prices, 1, "Should not create duplicate")
	assert.Equal(t, 1.60, prices[0].Price)
	assert.Equal(t, 2, prices[0].ConfirmationCount, "Should increment on conflict")
}

// TestUpsertFuelPrice_IncrementConfirmation tests that confirmation count increments
func TestUpsertFuelPrice_IncrementConfirmation(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgFuelPriceRepository(db)

	// Multiple upserts
	for i := 0; i < 5; i++ {
		err := repo.UpsertFuelPrice(station.ID, fuelType, 1.50+float64(i)*0.01)
		require.NoError(t, err)
	}

	prices, err := repo.GetStationPrices(station.ID)
	require.NoError(t, err)
	assert.Equal(t, 5, prices[0].ConfirmationCount)
}

// TestStationExists_True tests checking if a station exists (positive case)
func TestStationExists_True(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgFuelPriceRepository(db)
	exists, err := repo.StationExists(station.ID)

	require.NoError(t, err)
	assert.True(t, exists)
}

// TestStationExists_False tests checking if a station exists (negative case)
func TestStationExists_False(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgFuelPriceRepository(db)
	exists, err := repo.StationExists("00000000-0000-0000-0000-000000000000")

	require.NoError(t, err)
	assert.False(t, exists)
}

// TestFuelTypeExists_True tests checking if a fuel type exists (positive case)
func TestFuelTypeExists_True(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgFuelPriceRepository(db)
	exists, err := repo.FuelTypeExists(fuelType)

	require.NoError(t, err)
	assert.True(t, exists)
}

// TestFuelTypeExists_False tests checking if a fuel type exists (negative case)
func TestFuelTypeExists_False(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgFuelPriceRepository(db)
	exists, err := repo.FuelTypeExists("00000000-0000-0000-0000-000000000000")

	require.NoError(t, err)
	assert.False(t, exists)
}

// TestGetFuelPrices_StationIDFilter tests filtering by station ID
func TestGetFuelPrices_StationIDFilter(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	s1 := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	s2 := testhelpers.CreateTestStation(t, db, -33.8600, 151.2200)

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, fuelType, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, fuelType, 1.45)

	repo := NewPgFuelPriceRepository(db)

	filters := FuelPriceFilters{
		StationID: s1.ID,
	}
	results, err := repo.GetFuelPrices(filters)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)
	assert.Equal(t, s1.ID, results[0].StationID)
}

// TestGetFuelPrices_FuelTypeIDFilter tests filtering by fuel type ID
func TestGetFuelPrices_FuelTypeIDFilter(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")

	testhelpers.CreateTestFuelPrice(t, db, station.ID, e10, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, station.ID, diesel, 1.75)

	repo := NewPgFuelPriceRepository(db)

	filters := FuelPriceFilters{
		FuelTypeID: e10,
	}
	results, err := repo.GetFuelPrices(filters)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)
	assert.Equal(t, e10, results[0].FuelTypeID)
}

// TestGetFuelPrices_OrderedByDistance tests that results are ordered by distance
func TestGetFuelPrices_OrderedByDistance(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	centerLat, centerLon := -33.8568, 151.2153

	// Create stations at increasing distances
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon) // ~1km
	s2 := testhelpers.CreateTestStation(t, db, centerLat+0.02, centerLon) // ~2km

	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, fuelType, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, fuelType, 1.45)

	repo := NewPgFuelPriceRepository(db)

	filters := FuelPriceFilters{
		Lat:      centerLat,
		Lon:      centerLon,
		RadiusKm: 10,
	}
	results, err := repo.GetFuelPrices(filters)

	require.NoError(t, err)
	require.GreaterOrEqual(t, len(results), 2)

	// Verify ordering - first should be s1 (closest)
	assert.Equal(t, s1.ID, results[0].StationID, "Closest price should be first")
}
