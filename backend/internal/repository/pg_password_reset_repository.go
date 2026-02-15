package repository

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// PgPasswordResetRepository is the PostgreSQL implementation of PasswordResetRepository.
type PgPasswordResetRepository struct {
	db *sql.DB
}

func NewPgPasswordResetRepository(db *sql.DB) *PgPasswordResetRepository {
	return &PgPasswordResetRepository{db: db}
}

func (r *PgPasswordResetRepository) Create(userID, token string, expiresAt time.Time) error {
	id := uuid.New().String()
	_, err := r.db.Exec(`INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW())`, id, userID, token, expiresAt)
	return err
}

func (r *PgPasswordResetRepository) FindByToken(token string) (string, time.Time, error) {
	var userID string
	var expiresAt time.Time
	err := r.db.QueryRow(`SELECT user_id, expires_at FROM password_resets WHERE token = $1`, token).Scan(&userID, &expiresAt)
	return userID, expiresAt, err
}

func (r *PgPasswordResetRepository) DeleteByToken(token string) error {
	_, err := r.db.Exec(`DELETE FROM password_resets WHERE token = $1`, token)
	return err
}

var _ PasswordResetRepository = (*PgPasswordResetRepository)(nil)
