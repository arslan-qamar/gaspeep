package repository

import (
	"database/sql"
	"errors"

	"gaspeep/backend/internal/models"

	"github.com/google/uuid"
)

// PgUserRepository is the PostgreSQL implementation of UserRepository.
type PgUserRepository struct {
	db *sql.DB
}

func NewPgUserRepository(db *sql.DB) *PgUserRepository {
	return &PgUserRepository{db: db}
}

func (r *PgUserRepository) CreateUser(email, passwordHash, displayName, tier string) (*models.User, error) {
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

// CreateUserWithProvider creates a user record populated with OAuth/provider information.
func (r *PgUserRepository) CreateUserWithProvider(email, displayName, tier, provider, providerID, avatarURL string, emailVerified bool) (*models.User, error) {
	id := uuid.New().String()

	user := &models.User{
		ID:              id,
		Email:           email,
		DisplayName:     displayName,
		Tier:            tier,
		OAuthProvider:   provider,
		OAuthProviderID: providerID,
		AvatarURL:       avatarURL,
		EmailVerified:   emailVerified,
	}

	// Ensure password_hash column is populated (empty string) to satisfy schema
	// constraints for existing deployments where password_hash is NOT NULL.
	err := r.db.QueryRow(`
		INSERT INTO users (id, email, password_hash, display_name, tier, oauth_provider, oauth_provider_id, avatar_url, email_verified)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, email, display_name, tier, created_at, updated_at, oauth_provider, oauth_provider_id, avatar_url, email_verified
	`, id, email, "", displayName, tier, provider, providerID, avatarURL, emailVerified).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt, &user.UpdatedAt, &user.OAuthProvider, &user.OAuthProviderID, &user.AvatarURL, &user.EmailVerified,
	)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *PgUserRepository) GetUserByProvider(provider, providerID string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, email, display_name, tier, created_at, updated_at, oauth_provider, oauth_provider_id, avatar_url, email_verified
		FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2
	`, provider, providerID).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt, &user.UpdatedAt, &user.OAuthProvider, &user.OAuthProviderID, &user.AvatarURL, &user.EmailVerified,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

func (r *PgUserRepository) UpdateUserOAuth(userID, provider, providerID, avatarURL string, emailVerified bool) error {
	_, err := r.db.Exec(`
		UPDATE users SET oauth_provider = $1, oauth_provider_id = $2, avatar_url = $3, email_verified = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5
	`, provider, providerID, avatarURL, emailVerified, userID)
	return err
}

func (r *PgUserRepository) GetUserByEmail(email string) (*models.User, error) {
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

func (r *PgUserRepository) GetUserByID(id string) (*models.User, error) {
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

func (r *PgUserRepository) GetPasswordHash(email string) (string, error) {
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

func (r *PgUserRepository) UpdateUserTier(userID, tier string) error {
	_, err := r.db.Exec(`
		UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, tier, userID)
	return err
}

func (r *PgUserRepository) UpdatePassword(userID, passwordHash string) error {
	_, err := r.db.Exec(`
		UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, passwordHash, userID)
	return err
}

func (r *PgUserRepository) GetUserIDByEmail(email string) (string, error) {
	var userID string
	err := r.db.QueryRow(`SELECT id FROM users WHERE email = $1`, email).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}
	return userID, nil
}

func (r *PgUserRepository) UpdateProfile(userID, displayName, tier string) (string, error) {
	var updatedID string
	err := r.db.QueryRow(
		`UPDATE users SET display_name = COALESCE($1, display_name), tier = COALESCE($2, tier), updated_at = NOW() WHERE id = $3 RETURNING id`,
		displayName, tier, userID,
	).Scan(&updatedID)
	return updatedID, err
}

var _ UserRepository = (*PgUserRepository)(nil)
