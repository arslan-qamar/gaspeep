package repository

import "gaspeep/backend/internal/models"

// UserRepository defines data-access operations for users.
type UserRepository interface {
	CreateUser(email, passwordHash, displayName, tier string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetPasswordHash(email string) (string, error)
	UpdateUserTier(userID, tier string) error
	UpdatePassword(userID, passwordHash string) error
	GetUserIDByEmail(email string) (string, error)
	UpdateProfile(userID, displayName, tier string) (string, error)
}
