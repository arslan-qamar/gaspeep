package repository

import (
	"testing"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// TestCreateUser_ValidData tests creating a new user
func TestCreateUser_ValidData(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	repo := NewPgUserRepository(db)
	user, err := repo.CreateUser(
		"test@example.com",
		string(hashedPassword),
		"Test User",
		"free",
	)

	require.NoError(t, err)
	assert.NotNil(t, user)
	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "Test User", user.DisplayName)
	assert.Equal(t, "free", user.Tier)
	assert.False(t, user.CreatedAt.IsZero())
}

// TestGetUserByEmail_Success tests retrieving user by email
func TestGetUserByEmail_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserByEmail(user.Email)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, user.ID, result.ID)
	assert.Equal(t, user.Email, result.Email)
}

// TestGetUserByEmail_NotFound tests retrieving non-existent user by email
func TestGetUserByEmail_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserByEmail("nonexistent@example.com")

	assert.Error(t, err)
	assert.Nil(t, result)
}

// TestGetUserByID_Success tests retrieving user by ID
func TestGetUserByID_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserByID(user.ID)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, user.ID, result.ID)
	assert.Equal(t, user.Email, result.Email)
}

// TestGetUserByID_NotFound tests retrieving non-existent user by ID
func TestGetUserByID_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserByID("00000000-0000-0000-0000-000000000000")

	assert.Error(t, err)
	assert.Nil(t, result)
}

// TestGetPasswordHash_Success tests retrieving password hash
func TestGetPasswordHash_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	password := "password123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	repo := NewPgUserRepository(db)
	user, _ := repo.CreateUser(
		"test@example.com",
		string(hashedPassword),
		"Test",
		"free",
	)

	result, err := repo.GetPasswordHash(user.Email)

	require.NoError(t, err)
	assert.NotEmpty(t, result)
	// Verify the hash is correct
	assert.NoError(t, bcrypt.CompareHashAndPassword([]byte(result), []byte(password)))
}

// TestGetPasswordHash_NotFound tests retrieving password hash for non-existent user
func TestGetPasswordHash_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	result, err := repo.GetPasswordHash("nonexistent@example.com")

	assert.Error(t, err)
	assert.Empty(t, result)
}

// TestUpdateUserTier_Success tests updating user tier
func TestUpdateUserTier_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgUserRepository(db)
	err := repo.UpdateUserTier(user.ID, "premium")

	require.NoError(t, err)

	// Verify update
	result, err := repo.GetUserByID(user.ID)
	require.NoError(t, err)
	assert.Equal(t, "premium", result.Tier)
}

// TestUpdatePassword_Success tests updating user password
func TestUpdatePassword_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	newPassword := "newpassword123"
	newHashedPassword, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)

	repo := NewPgUserRepository(db)
	err := repo.UpdatePassword(user.ID, string(newHashedPassword))

	require.NoError(t, err)

	// Verify the password was updated
	hash, err := repo.GetPasswordHash(user.Email)
	require.NoError(t, err)
	assert.NoError(t, bcrypt.CompareHashAndPassword([]byte(hash), []byte(newPassword)))
}

// TestGetUserIDByEmail_Success tests retrieving user ID by email
func TestGetUserIDByEmail_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserIDByEmail(user.Email)

	require.NoError(t, err)
	assert.Equal(t, user.ID, result)
}

// TestGetUserIDByEmail_NotFound tests retrieving user ID for non-existent email
func TestGetUserIDByEmail_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserIDByEmail("nonexistent@example.com")

	require.NoError(t, err)
	assert.Empty(t, result)
}

// TestUpdateProfile_Success tests updating user profile
func TestUpdateProfile_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgUserRepository(db)
	newDisplayName := "Updated Name"
	newTier := "premium"
	updatedID, err := repo.UpdateProfile(user.ID, newDisplayName, newTier)

	require.NoError(t, err)
	assert.Equal(t, user.ID, updatedID)

	// Verify update
	result, err := repo.GetUserByID(user.ID)
	require.NoError(t, err)
	assert.Equal(t, newDisplayName, result.DisplayName)
	assert.Equal(t, newTier, result.Tier)
}

// TestCreateUserWithProvider_Success tests creating user with OAuth provider
func TestCreateUserWithProvider_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	user, err := repo.CreateUserWithProvider(
		"oauth@example.com",
		"OAuth User",
		"free",
		"google",
		"12345",
		"https://example.com/avatar.jpg",
		true,
	)

	require.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "oauth@example.com", user.Email)
	assert.Equal(t, "google", user.OAuthProvider)
	assert.Equal(t, "12345", user.OAuthProviderID)
	assert.Equal(t, "https://example.com/avatar.jpg", user.AvatarURL)
	assert.True(t, user.EmailVerified)
}

// TestGetUserByProvider_Success tests retrieving user by OAuth provider
func TestGetUserByProvider_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	user, _ := repo.CreateUserWithProvider(
		"oauth@example.com",
		"OAuth User",
		"free",
		"google",
		"12345",
		"https://example.com/avatar.jpg",
		true,
	)

	result, err := repo.GetUserByProvider("google", "12345")

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, user.ID, result.ID)
	assert.Equal(t, "google", result.OAuthProvider)
}

// TestGetUserByProvider_NotFound tests retrieving non-existent provider user
func TestGetUserByProvider_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	repo := NewPgUserRepository(db)
	result, err := repo.GetUserByProvider("google", "nonexistent")

	assert.Error(t, err)
	assert.Nil(t, result)
}

// TestUpdateUserOAuth_Success tests updating user with OAuth info
func TestUpdateUserOAuth_Success(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)

	repo := NewPgUserRepository(db)
	err := repo.UpdateUserOAuth(
		user.ID,
		"google",
		"67890",
		"https://example.com/avatar.jpg",
		true,
	)

	require.NoError(t, err)

	// Verify update by retrieving via provider
	result, err := repo.GetUserByProvider("google", "67890")
	require.NoError(t, err)
	assert.Equal(t, "google", result.OAuthProvider)
	assert.Equal(t, "67890", result.OAuthProviderID)
	assert.Equal(t, "https://example.com/avatar.jpg", result.AvatarURL)
	assert.True(t, result.EmailVerified)
}

func TestMapFilterPreferences_RoundTrip(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	repo := NewPgUserRepository(db)

	updateErr := repo.UpdateMapFilterPreferences(user.ID, models.MapFilterPreferences{
		FuelTypes:    []string{"u91", "diesel"},
		Brands:       []string{"Shell", "BP"},
		MaxPrice:     204.9,
		OnlyVerified: true,
	})
	require.NoError(t, updateErr)

	prefs, err := repo.GetMapFilterPreferences(user.ID)
	require.NoError(t, err)
	require.NotNil(t, prefs)
	assert.Equal(t, []string{"u91", "diesel"}, prefs.FuelTypes)
	assert.Equal(t, []string{"Shell", "BP"}, prefs.Brands)
	assert.Equal(t, 204.9, prefs.MaxPrice)
	assert.True(t, prefs.OnlyVerified)
}

func TestMapFilterPreferences_EmptyWhenUnset(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	repo := NewPgUserRepository(db)

	prefs, err := repo.GetMapFilterPreferences(user.ID)
	require.NoError(t, err)
	assert.Nil(t, prefs)
}
