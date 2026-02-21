package repository

import "gaspeep/backend/internal/models"

// UserRepository defines data-access operations for users.
type UserRepository interface {
	CreateUser(email, passwordHash, displayName, tier string) (*models.User, error)
	// CreateUserWithProvider creates a user record for an OAuth provider (passwordHash may be empty)
	CreateUserWithProvider(email, displayName, tier, provider, providerID, avatarURL string, emailVerified bool) (*models.User, error)
	// Get user by provider identifier
	GetUserByProvider(provider, providerID string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	// UpdateUserOAuth links an existing user with OAuth provider info
	UpdateUserOAuth(userID, provider, providerID, avatarURL string, emailVerified bool) error
	GetPasswordHash(email string) (string, error)
	UpdateUserTier(userID, tier string) error
	UpdatePassword(userID, passwordHash string) error
	GetUserIDByEmail(email string) (string, error)
	UpdateProfile(userID, displayName, tier string) (string, error)
	GetMapFilterPreferences(userID string) (*models.MapFilterPreferences, error)
	UpdateMapFilterPreferences(userID string, prefs models.MapFilterPreferences) error
}
