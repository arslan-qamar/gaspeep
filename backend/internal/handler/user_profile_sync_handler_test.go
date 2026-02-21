package handler

import (
	"bytes"
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"gaspeep/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockUserRepoProfile struct {
	getUserByIDFn    func(id string) (*models.User, error)
	updateProfileFn  func(userID, displayName, tier string) (string, error)
	getUserIDByEmail func(email string) (string, error)
}

func (m *mockUserRepoProfile) CreateUser(email, passwordHash, displayName, tier string) (*models.User, error) {
	return nil, nil
}
func (m *mockUserRepoProfile) CreateUserWithProvider(email, displayName, tier, provider, providerID, avatarURL string, emailVerified bool) (*models.User, error) {
	return nil, nil
}
func (m *mockUserRepoProfile) GetUserByProvider(provider, providerID string) (*models.User, error) {
	return nil, nil
}
func (m *mockUserRepoProfile) GetUserByEmail(email string) (*models.User, error) { return nil, nil }
func (m *mockUserRepoProfile) GetUserByID(id string) (*models.User, error) {
	if m.getUserByIDFn != nil {
		return m.getUserByIDFn(id)
	}
	return nil, errors.New("not found")
}
func (m *mockUserRepoProfile) UpdateUserOAuth(userID, provider, providerID, avatarURL string, emailVerified bool) error {
	return nil
}
func (m *mockUserRepoProfile) GetPasswordHash(email string) (string, error) { return "", nil }
func (m *mockUserRepoProfile) UpdateUserTier(userID, tier string) error     { return nil }
func (m *mockUserRepoProfile) UpdatePassword(userID, passwordHash string) error {
	return nil
}
func (m *mockUserRepoProfile) GetUserIDByEmail(email string) (string, error) {
	if m.getUserIDByEmail != nil {
		return m.getUserIDByEmail(email)
	}
	return "", nil
}
func (m *mockUserRepoProfile) UpdateProfile(userID, displayName, tier string) (string, error) {
	if m.updateProfileFn != nil {
		return m.updateProfileFn(userID, displayName, tier)
	}
	return userID, nil
}

type mockPasswordResetRepoProfile struct {
	createFn func(userID, token string, expiresAt time.Time) error
}

func (m *mockPasswordResetRepoProfile) Create(userID, token string, expiresAt time.Time) error {
	if m.createFn != nil {
		return m.createFn(userID, token, expiresAt)
	}
	return nil
}
func (m *mockPasswordResetRepoProfile) FindByToken(token string) (string, time.Time, error) {
	return "", time.Time{}, nil
}
func (m *mockPasswordResetRepoProfile) DeleteByToken(token string) error { return nil }

func TestUserProfileHandlerGetAndUpdateProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &mockUserRepoProfile{}
	prRepo := &mockPasswordResetRepoProfile{}
	h := NewUserProfileHandler(repo, prRepo)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", "u1")
		c.Next()
	})
	r.GET("/profile", h.GetProfile)
	r.PUT("/profile", h.UpdateProfile)

	repo.getUserByIDFn = func(id string) (*models.User, error) {
		return &models.User{ID: id, Email: "test@example.com", DisplayName: "Tester", Tier: "free"}, nil
	}
	req := httptest.NewRequest(http.MethodGet, "/profile", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	repo.getUserByIDFn = func(id string) (*models.User, error) { return nil, errors.New("not found") }
	req = httptest.NewRequest(http.MethodGet, "/profile", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	repo.updateProfileFn = func(userID, displayName, tier string) (string, error) {
		return userID, nil
	}
	body := []byte(`{"displayName":"New Name","tier":"premium"}`)
	req = httptest.NewRequest(http.MethodPut, "/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	req = httptest.NewRequest(http.MethodPut, "/profile", bytes.NewReader([]byte(`{"displayName":`)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	repo.updateProfileFn = func(userID, displayName, tier string) (string, error) { return "", sql.ErrNoRows }
	body = []byte(`{"displayName":"New Name","tier":"premium"}`)
	req = httptest.NewRequest(http.MethodPut, "/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	repo.updateProfileFn = func(userID, displayName, tier string) (string, error) { return "", errors.New("write failed") }
	body = []byte(`{"displayName":"New Name","tier":"premium"}`)
	req = httptest.NewRequest(http.MethodPut, "/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestUserProfileHandlerPasswordReset(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &mockUserRepoProfile{}
	prRepo := &mockPasswordResetRepoProfile{}
	h := NewUserProfileHandler(repo, prRepo)
	r := gin.New()
	r.POST("/password-reset", h.PasswordReset)

	req := httptest.NewRequest(http.MethodPost, "/password-reset", bytes.NewReader([]byte(`{"email":"bad"}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	repo.getUserIDByEmail = func(email string) (string, error) { return "", errors.New("db") }
	req = httptest.NewRequest(http.MethodPost, "/password-reset", bytes.NewReader([]byte(`{"email":"ok@example.com"}`)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	calledCreate := false
	repo.getUserIDByEmail = func(email string) (string, error) { return "", nil }
	prRepo.createFn = func(userID, token string, expiresAt time.Time) error {
		calledCreate = true
		return nil
	}
	req = httptest.NewRequest(http.MethodPost, "/password-reset", bytes.NewReader([]byte(`{"email":"ok@example.com"}`)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.False(t, calledCreate)

	repo.getUserIDByEmail = func(email string) (string, error) { return "u1", nil }
	req = httptest.NewRequest(http.MethodPost, "/password-reset", bytes.NewReader([]byte(`{"email":"ok@example.com"}`)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUserProfileHandlerUnauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewUserProfileHandler(&mockUserRepoProfile{}, &mockPasswordResetRepoProfile{})
	r := gin.New()
	r.GET("/profile", h.GetProfile)
	req := httptest.NewRequest(http.MethodGet, "/profile", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestServiceNSWSyncHandlerValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewServiceNSWSyncHandler(nil)
	require.NotNil(t, h)

	r := gin.New()
	r.POST("/sync", h.TriggerSync)

	req := httptest.NewRequest(http.MethodPost, "/sync", bytes.NewReader([]byte(`{"mode":""}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	req = httptest.NewRequest(http.MethodPost, "/sync", bytes.NewReader([]byte(`{"mode":"weekly"}`)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
