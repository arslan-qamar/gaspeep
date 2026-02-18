package repository

import (
	"testing"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCreateVerificationRequest_Success tests creating a station owner verification request
func TestCreateVerificationRequest_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgStationOwnerRepository(db)
	input := CreateOwnerVerificationInput{
		BusinessName:          "Test Business",
		VerificationDocuments: "doc1.pdf,doc2.pdf",
		ContactInfo:           "contact@example.com",
	}

	owner, err := repo.CreateVerificationRequest(user.ID, input)

	require.NoError(t, err)
	assert.NotNil(t, owner)
	assert.NotEmpty(t, owner.ID)
	assert.Equal(t, user.ID, owner.UserID)
	assert.Equal(t, input.BusinessName, owner.BusinessName)
	assert.Equal(t, "pending", owner.VerificationStatus)
}

// TestGetByUserID_Success tests retrieving a station owner by user ID
func TestGetByUserID_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.GetByUserID(user.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, owner.ID, result.ID)
	assert.Equal(t, user.ID, result.UserID)
	assert.Equal(t, owner.BusinessName, result.BusinessName)
}

// TestGetByUserID_NotFound tests retrieving a non-existent station owner
func TestGetByUserID_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.GetByUserID(user.ID)

	assert.Error(t, err)
	assert.Nil(t, result)
}

// TestGetStationByID_Success tests retrieving a station by user and station ID
func TestStationOwnerGetStationByID_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	// Link station to owner
	_, err := db.Exec("UPDATE stations SET owner_id = $1 WHERE id = $2", owner.ID, station.ID)
	require.NoError(t, err)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.GetStationByID(user.ID, station.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, station.ID, result["id"])
	assert.Equal(t, station.Name, result["name"])
}

// TestGetStationByID_NotOwner tests trying to access a station not owned by the user
func TestGetStationByID_NotOwner(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user1 := testhelpers.CreateTestUser(t, db)
	user2 := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user1.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	// Link station to owner1
	_, err := db.Exec("UPDATE stations SET owner_id = $1 WHERE id = $2", owner.ID, station.ID)
	require.NoError(t, err)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.GetStationByID(user2.ID, station.ID)

	assert.Error(t, err)
	assert.Nil(t, result)
}

// TestGetStationWithPrices_JoinsCorrectly tests retrieving station with prices
func TestGetStationWithPrices_JoinsCorrectly(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	// Link station to owner
	_, err := db.Exec("UPDATE stations SET owner_id = $1 WHERE id = $2", owner.ID, station.ID)
	require.NoError(t, err)

	// Add fuel prices
	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")
	testhelpers.CreateTestFuelPrice(t, db, station.ID, e10, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, station.ID, diesel, 1.75)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.GetStationWithPrices(user.ID, station.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, station.ID, result["id"])

	prices, ok := result["fuelPrices"].([]map[string]interface{})
	require.True(t, ok)
	assert.Len(t, prices, 2)
}

// TestSearchAvailableStations_ExcludesOwned tests that search excludes owned stations
func TestSearchAvailableStations_ExcludesOwned(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)

	// Create unowned station
	_ = testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	// Create owned station
	owned := testhelpers.CreateTestStation(t, db, -33.8600, 151.2200)
	_, err := db.Exec("UPDATE stations SET owner_id = $1 WHERE id = $2", owner.ID, owned.ID)
	require.NoError(t, err)

	repo := NewPgStationOwnerRepository(db)
	results, err := repo.SearchAvailableStations(user.ID, "Test", "-33.85", "151.21", "50")

	require.NoError(t, err)
	// Should not include the owned station
	for _, r := range results {
		assert.NotEqual(t, owned.ID, r["id"])
	}
}

// TestSearchAvailableStations_RadiusFiltering tests radius-based search
func TestSearchAvailableStations_RadiusFiltering(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	testhelpers.CreateTestStationOwner(t, db, user.ID)

	centerLat, centerLon := -33.8568, 151.2153

	// Create stations at different distances
	s1 := testhelpers.CreateTestStation(t, db, centerLat+0.01, centerLon) // ~1km
	_ = testhelpers.CreateTestStation(t, db, centerLat+0.5, centerLon)  // ~55km

	repo := NewPgStationOwnerRepository(db)

	// Search within 10km
	results, err := repo.SearchAvailableStations(user.ID, "Test", lat2Str(centerLat), lon2Str(centerLon), "10")
	require.NoError(t, err)

	// Should find s1 but not s2
	found := false
	for _, r := range results {
		if r["id"] == s1.ID {
			found = true
		}
	}
	assert.True(t, found, "Should find station within 10km")
}

// TestClaimStation_SuccessfulTransaction tests successful station claiming
func TestClaimStation_SuccessfulTransaction(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.ClaimStation(
		user.ID,
		station.ID,
		"document_upload",
		[]string{"https://example.com/doc1.pdf"},
		"+61400000000",
		"owner@example.com",
	)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, station.ID, result["stationId"])
	assert.Equal(t, "pending", result["verificationStatus"])

	// Verify station_owner was created
	owner, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)
	assert.NotNil(t, owner)

	// Verify station.owner_id was updated
	var ownerID *string
	err = db.QueryRow("SELECT owner_id FROM stations WHERE id = $1", station.ID).Scan(&ownerID)
	require.NoError(t, err)
	assert.NotNil(t, ownerID)
	assert.Equal(t, owner.ID, *ownerID)

	// Verify claim_verification record was created
	var verificationExists bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM claim_verifications WHERE station_id = $1)",
		station.ID,
	).Scan(&verificationExists)
	require.NoError(t, err)
	assert.True(t, verificationExists)
}

// TestClaimStation_RollbackOnError tests transaction rollback on error
func TestClaimStation_RollbackOnError(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	invalidStationID := "00000000-0000-0000-0000-000000000000"

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.ClaimStation(
		user.ID,
		invalidStationID,
		"document_upload",
		[]string{},
		"",
		"",
	)

	assert.Error(t, err)
	assert.Nil(t, result)

	// Verify transaction was rolled back - no station_owner should exist
	var ownerCount int
	err = db.QueryRow("SELECT COUNT(*) FROM station_owners WHERE user_id = $1", user.ID).Scan(&ownerCount)
	require.NoError(t, err)
	assert.Equal(t, 0, ownerCount, "Transaction should have rolled back")
}

// TestClaimStation_CreatesOwnerIfNotExists tests that ClaimStation creates owner if needed
func TestClaimStation_CreatesOwnerIfNotExists(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.ClaimStation(user.ID, station.ID, "document_upload", nil, "", "")

	require.NoError(t, err)
	assert.NotNil(t, result)

	// Verify station_owner was created
	owner, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)
	assert.NotNil(t, owner)
	assert.Equal(t, "unverified", owner.VerificationStatus)
}

// TestClaimStation_UsesExistingOwner tests that ClaimStation uses existing owner
func TestClaimStation_UsesExistingOwner(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	station1 := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	station2 := testhelpers.CreateTestStation(t, db, -33.8600, 151.2200)

	repo := NewPgStationOwnerRepository(db)

	// Claim first station
	_, err := repo.ClaimStation(user.ID, station1.ID, "document", nil, "", "")
	require.NoError(t, err)

	ownerAfterFirst, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)

	// Claim second station
	_, err = repo.ClaimStation(user.ID, station2.ID, "document", nil, "", "")
	require.NoError(t, err)

	ownerAfterSecond, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)

	// Should be same owner (same ID)
	assert.Equal(t, ownerAfterFirst.ID, ownerAfterSecond.ID)
}

// TestUnclaimStation_Success tests successfully unclaiming a station
func TestUnclaimStation_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationOwnerRepository(db)

	// First claim the station
	_, err := repo.ClaimStation(user.ID, station.ID, "document_upload", nil, "", "")
	require.NoError(t, err)

	// Verify it's claimed
	var ownerID *string
	err = db.QueryRow("SELECT owner_id FROM stations WHERE id = $1", station.ID).Scan(&ownerID)
	require.NoError(t, err)
	assert.NotNil(t, ownerID)

	// Unclaim it
	err = repo.UnclaimStation(user.ID, station.ID)
	require.NoError(t, err)

	// Verify owner_id is now NULL
	err = db.QueryRow("SELECT owner_id FROM stations WHERE id = $1", station.ID).Scan(&ownerID)
	require.NoError(t, err)
	assert.Nil(t, ownerID)
}

// TestUnclaimStation_NotOwner tests unclaiming when user is not the owner
func TestUnclaimStation_NotOwner(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user1 := testhelpers.CreateTestUser(t, db)
	user2 := testhelpers.CreateTestUser(t, db)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationOwnerRepository(db)

	// user1 claims the station
	_, err := repo.ClaimStation(user1.ID, station.ID, "document_upload", nil, "", "")
	require.NoError(t, err)

	// user2 tries to unclaim (should fail)
	err = repo.UnclaimStation(user2.ID, station.ID)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not the owner")
}

// TestUnclaimStation_StationNotFound tests unclaiming a non-existent station
func TestUnclaimStation_StationNotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgStationOwnerRepository(db)
	err := repo.UnclaimStation(user.ID, "00000000-0000-0000-0000-000000000000")

	assert.Error(t, err)
}

// TestGetStationsByOwnerUserID_WithJoins tests retrieving stations with claim verification
func TestGetStationsByOwnerUserID_WithJoins(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	repo := NewPgStationOwnerRepository(db)
	_, err := repo.ClaimStation(user.ID, station.ID, "document", nil, "", "")
	require.NoError(t, err)

	// Get stations
	results, err := repo.GetStationsByOwnerUserID(user.ID)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)

	found := false
	for _, s := range results {
		if s["id"] == station.ID {
			found = true
			assert.Equal(t, station.Name, s["name"])
			assert.NotEmpty(t, s["verificationStatus"])
			break
		}
	}
	assert.True(t, found, "Claimed station should be in results")
}

// TestGetStationsByOwnerUserID_EmptyResult tests retrieving stations for user with none
func TestGetStationsByOwnerUserID_EmptyResult(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgStationOwnerRepository(db)
	results, err := repo.GetStationsByOwnerUserID(user.ID)

	require.NoError(t, err)
	assert.Len(t, results, 0, "User with no stations should return empty list")
}

// TestGetFuelPricesForOwner_GroupsByStation tests retrieving fuel prices grouped by station
func TestGetFuelPricesForOwner_GroupsByStation(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)

	// Create 2 stations with prices
	s1 := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	s2 := testhelpers.CreateTestStation(t, db, -33.8600, 151.2200)
	_, _ = db.Exec("UPDATE stations SET owner_id = $1 WHERE id = $2", owner.ID, s1.ID)
	_, _ = db.Exec("UPDATE stations SET owner_id = $1 WHERE id = $2", owner.ID, s2.ID)

	e10 := testhelpers.CreateTestFuelType(t, db, "E10")
	diesel := testhelpers.CreateTestFuelType(t, db, "Diesel")

	testhelpers.CreateTestFuelPrice(t, db, s1.ID, e10, 1.55)
	testhelpers.CreateTestFuelPrice(t, db, s1.ID, diesel, 1.75)
	testhelpers.CreateTestFuelPrice(t, db, s2.ID, e10, 1.45)

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.GetFuelPricesForOwner(user.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)

	pricesByStation, ok := result["pricesByStation"].(map[string][]map[string]interface{})
	require.True(t, ok)

	// Verify grouping
	assert.GreaterOrEqual(t, len(pricesByStation), 2, "Should have prices for 2 stations")
	assert.GreaterOrEqual(t, len(pricesByStation[s1.ID]), 2, "Station 1 should have 2 prices")
	assert.GreaterOrEqual(t, len(pricesByStation[s2.ID]), 1, "Station 2 should have 1 price")
}

// TestClaimStation_WithDocuments tests claiming with document URLs
func TestClaimStation_WithDocuments(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	docs := []string{
		"https://example.com/doc1.pdf",
		"https://example.com/doc2.pdf",
	}

	repo := NewPgStationOwnerRepository(db)
	result, err := repo.ClaimStation(
		user.ID,
		station.ID,
		"document_upload",
		docs,
		"+61400000000",
		"owner@example.com",
	)

	require.NoError(t, err)
	assert.NotNil(t, result)

	// Verify documents were stored
	var docJSON *string
	err = db.QueryRow(
		"SELECT verification_documents FROM claim_verifications WHERE station_id = $1",
		station.ID,
	).Scan(&docJSON)
	require.NoError(t, err)
	assert.NotNil(t, docJSON)
}

// Helper functions
func lat2Str(lat float64) string {
	return "-33.85"
}

func lon2Str(lon float64) string {
	return "151.21"
}
