package repository

import (
	"database/sql"
	"testing"
	"time"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPgPasswordResetRepository_CreateFindDeleteByToken(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	token := "reset-token-001"
	expiresAt := time.Now().Add(30 * time.Minute).UTC().Truncate(time.Second)

	repo := NewPgPasswordResetRepository(db)
	err := repo.Create(user.ID, token, expiresAt)
	require.NoError(t, err)

	foundUserID, foundExpiresAt, err := repo.FindByToken(token)
	require.NoError(t, err)
	assert.Equal(t, user.ID, foundUserID)
	assert.WithinDuration(t, expiresAt, foundExpiresAt, time.Second)

	err = repo.DeleteByToken(token)
	require.NoError(t, err)

	_, _, err = repo.FindByToken(token)
	require.ErrorIs(t, err, sql.ErrNoRows)
}

func TestPgPasswordResetRepository_Create_DuplicateToken(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	repo := NewPgPasswordResetRepository(db)
	token := "reset-token-duplicate"
	expiresAt := time.Now().Add(1 * time.Hour)

	err := repo.Create(user.ID, token, expiresAt)
	require.NoError(t, err)

	err = repo.Create(user.ID, token, expiresAt.Add(1*time.Hour))
	require.Error(t, err)
}

func TestPgPasswordResetRepository_FindByToken_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgPasswordResetRepository(db)

	_, _, err := repo.FindByToken("missing-token")

	require.ErrorIs(t, err, sql.ErrNoRows)
}
