package repository

import (
	"testing"
	"time"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPgBroadcastRepository_CreateAndGetByID(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)

	start := time.Now().Add(2 * time.Hour).UTC().Truncate(time.Second)
	end := start.Add(24 * time.Hour)
	input := CreateBroadcastInput{
		StationID:       station.ID,
		Title:           "Weekend fuel special",
		Message:         "E10 and Diesel discounts this weekend",
		TargetRadiusKm:  8,
		StartDate:       start,
		EndDate:         end,
		TargetFuelTypes: `["E10","Diesel"]`,
	}

	repo := NewPgBroadcastRepository(db)
	created, err := repo.Create(owner.ID, input)

	require.NoError(t, err)
	require.NotNil(t, created)
	assert.NotEmpty(t, created.ID)
	assert.Equal(t, owner.ID, created.StationOwnerID)
	assert.Equal(t, station.ID, created.StationID)
	assert.Equal(t, input.Title, created.Title)
	assert.Equal(t, "scheduled", created.BroadcastStatus)
	assert.Equal(t, 0, created.Views)
	assert.Equal(t, 0, created.Clicks)
	require.NotNil(t, created.TargetFuelTypes)
	assert.Equal(t, input.TargetFuelTypes, *created.TargetFuelTypes)
	assert.WithinDuration(t, start, created.StartDate, time.Second)
	assert.WithinDuration(t, end, created.EndDate, time.Second)

	got, err := repo.GetByID(created.ID, owner.ID)
	require.NoError(t, err)
	require.NotNil(t, got)
	assert.Equal(t, created.ID, got.ID)
	assert.Equal(t, created.Title, got.Title)
}

func TestPgBroadcastRepository_GetByOwnerID(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	testhelpers.CreateTestBroadcast(t, db, owner.ID, station.ID)
	testhelpers.CreateTestBroadcast(t, db, owner.ID, station.ID)

	repo := NewPgBroadcastRepository(db)
	broadcasts, err := repo.GetByOwnerID(owner.ID)

	require.NoError(t, err)
	require.Len(t, broadcasts, 2)
	for _, b := range broadcasts {
		assert.Equal(t, owner.ID, b.StationOwnerID)
	}
}

func TestPgBroadcastRepository_Update(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	broadcast := testhelpers.CreateTestBroadcast(t, db, owner.ID, station.ID)

	start := time.Now().Add(4 * time.Hour).UTC().Truncate(time.Second)
	end := start.Add(48 * time.Hour)
	input := UpdateBroadcastInput{
		Title:           "Updated title",
		Message:         "Updated message",
		TargetRadiusKm:  12,
		StartDate:       start,
		EndDate:         end,
		BroadcastStatus: "draft",
		TargetFuelTypes: `["U91"]`,
	}

	repo := NewPgBroadcastRepository(db)
	updatedID, err := repo.Update(broadcast.ID, owner.ID, input)

	require.NoError(t, err)
	assert.Equal(t, broadcast.ID, updatedID)

	updated, err := repo.GetByID(broadcast.ID, owner.ID)
	require.NoError(t, err)
	assert.Equal(t, input.Title, updated.Title)
	assert.Equal(t, input.Message, updated.Message)
	assert.Equal(t, input.TargetRadiusKm, updated.TargetRadiusKm)
	assert.Equal(t, input.BroadcastStatus, updated.BroadcastStatus)
	require.NotNil(t, updated.TargetFuelTypes)
	assert.Equal(t, input.TargetFuelTypes, *updated.TargetFuelTypes)
}

func TestPgBroadcastRepository_GetByID_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgBroadcastRepository(db)

	got, err := repo.GetByID("00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002")

	require.Error(t, err)
	assert.Nil(t, got)
	assert.Equal(t, "broadcast not found", err.Error())
}

func TestPgBroadcastRepository_Delete(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	owner := testhelpers.CreateTestStationOwner(t, db, user.ID)
	station := testhelpers.CreateTestStation(t, db, -33.8568, 151.2153)
	broadcast := testhelpers.CreateTestBroadcast(t, db, owner.ID, station.ID)

	repo := NewPgBroadcastRepository(db)
	err := repo.Delete(broadcast.ID, owner.ID)
	require.NoError(t, err)

	_, err = repo.GetByID(broadcast.ID, owner.ID)
	require.Error(t, err)
}

func TestPgBroadcastRepository_Delete_NotOwnedOrMissing(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgBroadcastRepository(db)

	err := repo.Delete("00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "broadcast not found or not owned by user")
}
