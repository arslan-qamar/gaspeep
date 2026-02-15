package repository

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// PasswordResetRepository handles DB operations for password resets
type PasswordResetRepository struct {
	db *sql.DB
}

func NewPasswordResetRepository(db *sql.DB) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

// Create inserts a new password reset record
func (r *PasswordResetRepository) Create(userID, token string, expiresAt time.Time) error {
	id := uuid.New().String()
	_, err := r.db.Exec(`INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW())`, id, userID, token, expiresAt)
	return err
}

// Optional: lookup by token
func (r *PasswordResetRepository) FindByToken(token string) (string, time.Time, error) {
	var userID string
	var expiresAt time.Time
	err := r.db.QueryRow(`SELECT user_id, expires_at FROM password_resets WHERE token = $1`, token).Scan(&userID, &expiresAt)
	return userID, expiresAt, err
}

// DeleteByToken removes a password reset entry after use
func (r *PasswordResetRepository) DeleteByToken(token string) error {
	_, err := r.db.Exec(`DELETE FROM password_resets WHERE token = $1`, token)
	return err
}
