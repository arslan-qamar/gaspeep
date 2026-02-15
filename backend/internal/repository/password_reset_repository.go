package repository

import "time"

// PasswordResetRepository defines data-access operations for password resets.
type PasswordResetRepository interface {
	Create(userID, token string, expiresAt time.Time) error
	FindByToken(token string) (string, time.Time, error)
	DeleteByToken(token string) error
}
