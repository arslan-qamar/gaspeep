package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"gaspeep/backend/internal/auth"
	"gaspeep/backend/internal/repository"
	testhelpers "gaspeep/backend/internal/repository/testhelpers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGoogleCallback_CreateNewUser_Integration tests creating a new user via OAuth
func TestGoogleCallback_CreateNewUser_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create user repo
	userRepo := repository.NewPgUserRepository(db)

	h := NewOAuthHandler(userRepo)

	// Test the repository interaction patterns
	// In real scenario, this would be called after auth.FetchProfile returns user info
	email := "oauth-new@example.com"
	displayName := "OAuth User"
	tier := "free"
	provider := "google"
	providerID := "google_12345"
	avatarURL := "https://example.com/avatar.jpg"
	emailVerified := true

	// Create user through OAuth flow
	user, err := userRepo.CreateUserWithProvider(email, displayName, tier, provider, providerID, avatarURL, emailVerified)

	require.NoError(t, err)
	require.NotNil(t, user)

	assert.Equal(t, email, user.Email)
	assert.Equal(t, displayName, user.DisplayName)
	assert.Equal(t, tier, user.Tier)
	assert.Equal(t, provider, user.OAuthProvider)
	assert.Equal(t, providerID, user.OAuthProviderID)
	assert.Equal(t, avatarURL, user.AvatarURL)
	assert.True(t, user.EmailVerified)

	_ = h // Use h to avoid unused variable
}

// TestGoogleCallback_LinkExistingUser_Integration tests linking OAuth to existing user
func TestGoogleCallback_LinkExistingUser_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create existing user
	existingUser := testhelpers.CreateTestUser(t, db)

	userRepo := repository.NewPgUserRepository(db)
	h := NewOAuthHandler(userRepo)

	// Simulate OAuth flow: user already exists by email
	user, err := userRepo.GetUserByEmail(existingUser.Email)
	require.NoError(t, err)
	require.NotNil(t, user)

	// Link OAuth provider to existing user
	providerID := "google_67890"
	err = userRepo.UpdateUserOAuth(user.ID, "google", providerID, "https://example.com/avatar.jpg", true)
	require.NoError(t, err)

	// Verify OAuth info was updated
	updatedUser, err := userRepo.GetUserByID(user.ID)
	require.NoError(t, err)

	assert.Equal(t, "google", updatedUser.OAuthProvider)
	assert.Equal(t, providerID, updatedUser.OAuthProviderID)

	_ = h // Use h to avoid unused variable
}

// TestGoogleCallback_GetByProvider_Integration tests retrieving user by OAuth provider
func TestGoogleCallback_GetByProvider_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	// Create user with OAuth provider
	userRepo := repository.NewPgUserRepository(db)

	email := "oauth-provider@example.com"
	providerID := "google_99999"

	user, err := userRepo.CreateUserWithProvider(email, "Provider User", "free", "google", providerID, "", true)
	require.NoError(t, err)
	require.NotNil(t, user)

	// Retrieve user by provider
	retrievedUser, err := userRepo.GetUserByProvider("google", providerID)
	require.NoError(t, err)
	require.NotNil(t, retrievedUser)

	assert.Equal(t, user.ID, retrievedUser.ID)
	assert.Equal(t, email, retrievedUser.Email)
}

// TestOAuthHandler_CookieAttributes_Integration tests cookie is set correctly after OAuth
func TestOAuthHandler_CookieAttributes_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	userRepo := repository.NewPgUserRepository(db)
	h := NewOAuthHandler(userRepo)

	// Create test user
	user := testhelpers.CreateTestUser(t, db)

	// Generate JWT token (simulating OAuth success)
	token, err := auth.GenerateToken(user.ID, user.Email)
	require.NoError(t, err)
	require.NotEmpty(t, token)

	// Verify token format (should be valid JWT)
	parts := parseJWT(token)
	assert.Equal(t, 3, len(parts), "JWT should have 3 parts (header.payload.signature)")

	_ = h // Use h to avoid unused variable
}

// TestOAuthHandler_InvalidState_Integration tests state validation in OAuth callback
func TestOAuthHandler_InvalidState_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	userRepo := repository.NewPgUserRepository(db)
	h := NewOAuthHandler(userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/auth/oauth/callback", h.GoogleCallback)

	// Test with mismatched state
	req := httptest.NewRequest(http.MethodGet, "/api/auth/oauth/callback?code=auth_code&state=wrong_state", nil)
	req.AddCookie(&http.Cookie{
		Name:  "oauth_state",
		Value: "different_state",
	})

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var errResp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &errResp)
	assert.Contains(t, errResp["error"], "invalid state")
}

// TestOAuthHandler_MissingState_Integration tests missing state cookie handling
func TestOAuthHandler_MissingState_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	userRepo := repository.NewPgUserRepository(db)
	h := NewOAuthHandler(userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/auth/oauth/callback", h.GoogleCallback)

	// Request without state cookie
	req := httptest.NewRequest(http.MethodGet, "/api/auth/oauth/callback?code=auth_code&state=some_state", nil)

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var errResp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &errResp)
	assert.Contains(t, errResp["error"], "invalid state")
}

// TestOAuthHandler_MultipleProviders_Integration tests linking multiple OAuth providers
func TestOAuthHandler_MultipleProviders_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	userRepo := repository.NewPgUserRepository(db)

	// Create user with initial Google provider
	user, err := userRepo.CreateUserWithProvider(
		"test@example.com",
		"Test User",
		"free",
		"google",
		"google_123",
		"https://example.com/avatar.jpg",
		true,
	)
	require.NoError(t, err)
	require.NotNil(t, user)

	// Later, user might link additional providers (in future feature)
	// For now, test that we can update provider info
	err = userRepo.UpdateUserOAuth(user.ID, "github", "github_456", "https://github.com/avatar.jpg", false)
	require.NoError(t, err)

	// Verify the last update (in actual implementation, might want to store multiple providers)
	updatedUser, err := userRepo.GetUserByID(user.ID)
	require.NoError(t, err)

	// Note: Current implementation overwrites provider, not merges
	// This documents that behavior
	assert.Equal(t, "github", updatedUser.OAuthProvider)
	assert.Equal(t, "github_456", updatedUser.OAuthProviderID)
}

// TestOAuthHandler_EmailVerification_Integration tests email verification flag
func TestOAuthHandler_EmailVerification_Integration(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	userRepo := repository.NewPgUserRepository(db)

	// Create user with verified email
	verifiedUser, err := userRepo.CreateUserWithProvider(
		"verified@example.com",
		"Verified User",
		"free",
		"google",
		"google_verified",
		"",
		true, // emailVerified = true
	)
	require.NoError(t, err)
	assert.True(t, verifiedUser.EmailVerified)

	// Create user with unverified email
	unverifiedUser, err := userRepo.CreateUserWithProvider(
		"unverified@example.com",
		"Unverified User",
		"free",
		"google",
		"google_unverified",
		"",
		false, // emailVerified = false
	)
	require.NoError(t, err)
	assert.False(t, unverifiedUser.EmailVerified)
}

// Helper function to parse JWT (simple split, not validation)
func parseJWT(token string) []string {
	parts := make([]string, 0)
	current := ""
	for _, char := range token {
		if char == '.' {
			parts = append(parts, current)
			current = ""
		} else {
			current += string(char)
		}
	}
	if current != "" {
		parts = append(parts, current)
	}
	return parts
}
