package repository

import (
	"database/sql"
	"errors"

	"gaspeep/backend/internal/models"

	"github.com/google/uuid"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(email, passwordHash, displayName, tier string) (*models.User, error) {
	id := uuid.New().String()

	user := &models.User{
		ID:           id,
		Email:        email,
		DisplayName:  displayName,
		PasswordHash: passwordHash,
		Tier:         tier,
	}

	err := r.db.QueryRow(`
		INSERT INTO users (id, email, password_hash, display_name, tier)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, display_name, tier, created_at, updated_at
	`, id, email, passwordHash, displayName, tier).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, email, display_name, tier, created_at, updated_at FROM users WHERE email = $1
	`, email).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, email, display_name, tier, created_at, updated_at FROM users WHERE id = $1
	`, id).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetPasswordHash(email string) (string, error) {
	var passwordHash string
	err := r.db.QueryRow(`
		SELECT password_hash FROM users WHERE email = $1
	`, email).Scan(&passwordHash)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errors.New("user not found")
		}
		return "", err
	}

	return passwordHash, nil
}

func (r *UserRepository) UpdateUserTier(userID, tier string) error {
	_, err := r.db.Exec(`
		UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, tier, userID)

	return err
}

func (r *UserRepository) UpdatePassword(userID, passwordHash string) error {
	_, err := r.db.Exec(`
		UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, passwordHash, userID)
	return err
}
