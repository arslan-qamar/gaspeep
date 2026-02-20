package repository

import (
	"testing"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCreate_Success tests creating a new alert
func TestCreate_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgAlertRepository(db)
	input := CreateAlertInput{
		FuelTypeID:     fuelType,
		PriceThreshold: 1.50,
		Latitude:       -33.8568,
		Longitude:      151.2153,
		RadiusKm:       10,
		AlertName:      "My Alert",
	}

	alert, err := repo.Create(user.ID, input)

	require.NoError(t, err)
	assert.NotNil(t, alert)
	assert.NotEmpty(t, alert.ID)
	assert.Equal(t, user.ID, alert.UserID)
	assert.Equal(t, fuelType, alert.FuelTypeID)
	assert.Equal(t, 1.50, alert.PriceThreshold)
	assert.Equal(t, -33.8568, alert.Latitude)
	assert.Equal(t, 151.2153, alert.Longitude)
	assert.Equal(t, 10, alert.RadiusKm)
	assert.Equal(t, "My Alert", alert.AlertName)
	assert.Equal(t, "recurring", alert.RecurrenceType)
	assert.True(t, alert.IsActive)
}

// TestGetByUserID_Success tests retrieving alerts for a user
func TestAlertGetByUserID_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	alert1 := testhelpers.CreateTestAlert(t, db, user.ID, -33.8568, 151.2153)
	alert2 := testhelpers.CreateTestAlert(t, db, user.ID, -33.9000, 151.2300)

	repo := NewPgAlertRepository(db)
	results, err := repo.GetByUserID(user.ID)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 2)

	// Verify both alerts are present
	ids := make(map[string]bool)
	for _, a := range results {
		ids[a.ID] = true
	}
	assert.True(t, ids[alert1.ID])
	assert.True(t, ids[alert2.ID])
}

// TestGetByUserID_EmptyResult tests retrieving alerts for user with none
func TestGetByUserID_EmptyResult(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgAlertRepository(db)
	results, err := repo.GetByUserID(user.ID)

	require.NoError(t, err)
	assert.Len(t, results, 0)
}

// TestGetByUserID_OrderedByCreatedAt tests that alerts are ordered by created_at DESC
func TestGetByUserID_OrderedByCreatedAt(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	_ = testhelpers.CreateTestAlert(t, db, user.ID, -33.8568, 151.2153)

	// Create second alert (should be newer)
	alert2 := testhelpers.CreateTestAlert(t, db, user.ID, -33.9000, 151.2300)

	repo := NewPgAlertRepository(db)
	results, err := repo.GetByUserID(user.ID)

	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 2)

	// First result should be alert2 (most recent)
	assert.Equal(t, alert2.ID, results[0].ID)
}

// TestUpdate_Success tests updating an alert
func TestUpdate_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	alert := testhelpers.CreateTestAlert(t, db, user.ID, -33.8568, 151.2153)

	repo := NewPgAlertRepository(db)
	input := UpdateAlertInput{
		PriceThreshold: 2.00,
		RadiusKm:       20,
		AlertName:      "Updated Alert",
		IsActive:       ptrBool(false),
	}

	updatedID, err := repo.Update(alert.ID, user.ID, input)

	require.NoError(t, err)
	assert.Equal(t, alert.ID, updatedID)

	// Verify update
	results, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(results), 1)

	updated := results[0]
	assert.Equal(t, 2.00, updated.PriceThreshold)
	assert.Equal(t, 20, updated.RadiusKm)
	assert.Equal(t, "Updated Alert", updated.AlertName)
	assert.False(t, updated.IsActive)
}

// TestUpdate_PartialUpdate tests updating only some fields
func TestUpdate_PartialUpdate(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	alert := testhelpers.CreateTestAlert(t, db, user.ID, -33.8568, 151.2153)

	repo := NewPgAlertRepository(db)
	input := UpdateAlertInput{
		AlertName: "New Name",
		// Leave other fields with zero values (should not update)
	}

	_, err := repo.Update(alert.ID, user.ID, input)
	require.NoError(t, err)

	// Verify only AlertName changed
	results, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)
	updated := results[0]

	assert.Equal(t, "New Name", updated.AlertName)
	// Original values should remain (or be used if zero values update)
}

// TestDelete_Success tests deleting an alert
func TestDelete_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	alert := testhelpers.CreateTestAlert(t, db, user.ID, -33.8568, 151.2153)

	repo := NewPgAlertRepository(db)
	deleted, err := repo.Delete(alert.ID, user.ID)

	require.NoError(t, err)
	assert.True(t, deleted)

	// Verify deletion
	results, err := repo.GetByUserID(user.ID)
	require.NoError(t, err)
	assert.Len(t, results, 0)
}

// TestDelete_NotFound tests deleting a non-existent alert
func TestDelete_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgAlertRepository(db)
	deleted, err := repo.Delete("00000000-0000-0000-0000-000000000000", user.ID)

	require.NoError(t, err)
	assert.False(t, deleted)
}

// TestDelete_NotOwner tests trying to delete someone else's alert
func TestDelete_NotOwner(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user1 := testhelpers.CreateTestUser(t, db)
	user2 := testhelpers.CreateTestUser(t, db)
	alert := testhelpers.CreateTestAlert(t, db, user1.ID, -33.8568, 151.2153)

	repo := NewPgAlertRepository(db)
	deleted, err := repo.Delete(alert.ID, user2.ID)

	require.NoError(t, err)
	assert.False(t, deleted)

	// Verify alert still exists for original user
	results, err := repo.GetByUserID(user1.ID)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(results), 1)
}

// TestCreate_WithDifferentRadii tests creating alerts with different radius values
func TestCreate_WithDifferentRadii(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgAlertRepository(db)

	testCases := []int{1, 5, 10, 50, 100}
	for _, radius := range testCases {
		input := CreateAlertInput{
			FuelTypeID:     fuelType,
			PriceThreshold: 1.50,
			Latitude:       -33.8568,
			Longitude:      151.2153,
			RadiusKm:       radius,
			AlertName:      "Alert",
		}

		alert, err := repo.Create(user.ID, input)
		require.NoError(t, err, "Failed for radius %d", radius)
		assert.Equal(t, radius, alert.RadiusKm)
	}
}

// TestCreate_WithDifferentPriceThresholds tests alerts with different prices
func TestCreate_WithDifferentPriceThresholds(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgAlertRepository(db)

	testCases := []float64{0.50, 1.00, 1.50, 2.00, 3.00}
	for _, threshold := range testCases {
		input := CreateAlertInput{
			FuelTypeID:     fuelType,
			PriceThreshold: threshold,
			Latitude:       -33.8568,
			Longitude:      151.2153,
			RadiusKm:       10,
			AlertName:      "Alert",
		}

		alert, err := repo.Create(user.ID, input)
		require.NoError(t, err, "Failed for threshold %.2f", threshold)
		assert.Equal(t, threshold, alert.PriceThreshold)
	}
}

func TestCreate_WithOneOffRecurrence(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	fuelType := testhelpers.CreateTestFuelType(t, db, "E10")

	repo := NewPgAlertRepository(db)
	input := CreateAlertInput{
		FuelTypeID:     fuelType,
		PriceThreshold: 1.50,
		Latitude:       -33.8568,
		Longitude:      151.2153,
		RadiusKm:       10,
		AlertName:      "One Off Alert",
		RecurrenceType: "one_off",
	}

	alert, err := repo.Create(user.ID, input)

	require.NoError(t, err)
	assert.Equal(t, "one_off", alert.RecurrenceType)
}

func TestGetPriceContext_WithNearbyPrices(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	fuelTypeID := testhelpers.CreateTestFuelType(t, db, "Diesel")
	station1 := testhelpers.CreateTestStation(t, db, -33.8688, 151.2093)
	station2 := testhelpers.CreateTestStation(t, db, -33.8700, 151.2100)
	testhelpers.CreateTestFuelPrice(t, db, station1.ID, fuelTypeID, 1.90)
	testhelpers.CreateTestFuelPrice(t, db, station2.ID, fuelTypeID, 1.80)

	repo := NewPgAlertRepository(db)
	context, err := repo.GetPriceContext(PriceContextInput{
		FuelTypeID: fuelTypeID,
		Latitude:   -33.8688,
		Longitude:  151.2093,
		RadiusKm:   15,
	})

	require.NoError(t, err)
	require.NotNil(t, context)
	assert.Equal(t, fuelTypeID, context.FuelTypeID)
	assert.Equal(t, "Diesel", context.FuelTypeName)
	assert.Equal(t, 2, context.StationCount)
	assert.InDelta(t, 1.85, context.AveragePrice, 0.0001)
	assert.InDelta(t, 1.80, context.LowestPrice, 0.0001)
	assert.Equal(t, station2.ID, context.LowestPriceStationID)
	assert.NotEmpty(t, context.LowestPriceStationName)
}

func TestGetPriceContext_NoNearbyPrices_ReturnsZeroedContext(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	fuelTypeID := testhelpers.CreateTestFuelType(t, db, "LPG")

	repo := NewPgAlertRepository(db)
	context, err := repo.GetPriceContext(PriceContextInput{
		FuelTypeID: fuelTypeID,
		Latitude:   -33.8688,
		Longitude:  151.2093,
		RadiusKm:   10,
	})

	require.NoError(t, err)
	require.NotNil(t, context)
	assert.Equal(t, fuelTypeID, context.FuelTypeID)
	assert.Equal(t, "LPG", context.FuelTypeName)
	assert.Equal(t, 0, context.StationCount)
	assert.Equal(t, 0.0, context.AveragePrice)
	assert.Equal(t, 0.0, context.LowestPrice)
	assert.Equal(t, "", context.LowestPriceStationID)
	assert.Equal(t, "", context.LowestPriceStationName)
}

// Helper function
func ptrBool(b bool) *bool {
	return &b
}
