package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"gaspeep/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// mockUserRepo implements the minimal UserRepository behavior needed for the test.
type mockUserRepo struct {
	users     map[string]*models.User
	passwords map[string]string
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users:     map[string]*models.User{},
		passwords: map[string]string{},
	}
}

func (m *mockUserRepo) CreateUser(email, passwordHash, displayName, tier string) (*models.User, error) {
	u := &models.User{ID: "u1", Email: email, DisplayName: displayName, Tier: tier, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.users[email] = u
	m.passwords[email] = passwordHash
	return u, nil
}
func (m *mockUserRepo) CreateUserWithProvider(email, displayName, tier, provider, providerID, avatarURL string, emailVerified bool) (*models.User, error) {
	return nil, nil
}
func (m *mockUserRepo) GetUserByProvider(provider, providerID string) (*models.User, error) {
	return nil, nil
}
func (m *mockUserRepo) GetUserByEmail(email string) (*models.User, error) {
	if u, ok := m.users[email]; ok {
		return u, nil
	}
	return nil, nil
}
func (m *mockUserRepo) GetUserByID(id string) (*models.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, nil
}
func (m *mockUserRepo) UpdateUserOAuth(userID, provider, providerID, avatarURL string, emailVerified bool) error {
	return nil
}
func (m *mockUserRepo) GetPasswordHash(email string) (string, error) {
	if h, ok := m.passwords[email]; ok {
		return h, nil
	}
	return "", nil
}
func (m *mockUserRepo) UpdateUserTier(userID, tier string) error         { return nil }
func (m *mockUserRepo) UpdatePassword(userID, passwordHash string) error { return nil }
func (m *mockUserRepo) GetUserIDByEmail(email string) (string, error)    { return "", nil }
func (m *mockUserRepo) UpdateProfile(userID, displayName, tier string) (string, error) {
	return "", nil
}
func (m *mockUserRepo) GetMapFilterPreferences(userID string) (*models.MapFilterPreferences, error) {
	return nil, nil
}
func (m *mockUserRepo) UpdateMapFilterPreferences(userID string, prefs models.MapFilterPreferences) error {
	return nil
}

// TestSignInSetsAuthCookie verifies that signing in sets an HttpOnly auth cookie.
func TestSignInSetsAuthCookie(t *testing.T) {
	// Use gin in test mode
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()

	// create a test user with a known password
	email := "test@example.com"
	plain := "password123"
	hashed, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	// populate mock repo
	repo.users[email] = &models.User{ID: "u1", Email: email, DisplayName: "Tester", CreatedAt: time.Now(), UpdatedAt: time.Now()}
	repo.passwords[email] = string(hashed)

	// Create handler with mock repo. pass nil for password reset repo since not used here
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signin", h.SignIn)

	payload := map[string]string{"email": email, "password": plain}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signin", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", rr.Code)
	}

	resp := rr.Result()
	defer resp.Body.Close()

	found := false
	for _, c := range resp.Cookies() {
		if c.Name == "auth_token" {
			found = true
			if !c.HttpOnly {
				t.Fatalf("expected auth_token cookie to be HttpOnly")
			}
			// token value should be non-empty
			if c.Value == "" {
				t.Fatalf("expected auth_token cookie to have a value")
			}
		}
	}

	if !found {
		t.Fatalf("auth_token cookie not set on sign-in")
	}
}

// TestSignUp_ValidRegistration verifies successful user registration
func TestSignUp_ValidRegistration(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signup", h.SignUp)

	email := "newuser@example.com"
	payload := map[string]string{
		"email":       email,
		"password":    "SecurePassword123",
		"displayName": "New User",
		"tier":        "free",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", rr.Code)
	}

	var response AuthResponse
	json.Unmarshal(rr.Body.Bytes(), &response)

	if response.User == nil {
		t.Fatalf("expected user in response")
	}
	if response.Token == "" {
		t.Fatalf("expected token in response")
	}
	if response.User.Email != email {
		t.Fatalf("expected email %s, got %s", email, response.User.Email)
	}
	if response.User.DisplayName != "New User" {
		t.Fatalf("expected displayName 'New User', got %s", response.User.DisplayName)
	}
	if response.User.Tier != "free" {
		t.Fatalf("expected tier 'free', got %s", response.User.Tier)
	}

	// Verify cookie is set
	resp := rr.Result()
	defer resp.Body.Close()
	found := false
	for _, c := range resp.Cookies() {
		if c.Name == "auth_token" && c.Value != "" && c.HttpOnly {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("auth_token cookie not properly set on signup")
	}
}

// TestSignUp_EmailConflict verifies conflict when email already exists
func TestSignUp_EmailConflict(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	email := "existing@example.com"
	repo.users[email] = &models.User{
		ID:    "existing_user",
		Email: email,
	}

	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signup", h.SignUp)

	payload := map[string]string{
		"email":       email,
		"password":    "SecurePassword123",
		"displayName": "Duplicate User",
		"tier":        "free",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", rr.Code)
	}

	var errResp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &errResp)
	if errResp["error"] != "user already exists" {
		t.Fatalf("expected error 'user already exists', got %s", errResp["error"])
	}
}

// TestSignUp_InvalidEmail verifies validation of email format
func TestSignUp_InvalidEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signup", h.SignUp)

	payload := map[string]string{
		"email":       "not-an-email",
		"password":    "SecurePassword123",
		"displayName": "Test User",
		"tier":        "free",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

// TestSignUp_ShortPassword verifies password minimum length requirement
func TestSignUp_ShortPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signup", h.SignUp)

	payload := map[string]string{
		"email":       "test@example.com",
		"password":    "short",
		"displayName": "Test User",
		"tier":        "free",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

// TestSignUp_MissingFields verifies validation of required fields
func TestSignUp_MissingFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signup", h.SignUp)

	tests := []map[string]string{
		{"email": "test@example.com", "password": "pass123", "displayName": "Test"},
		{"email": "test@example.com", "password": "pass123", "tier": "free"},
		{"email": "test@example.com", "displayName": "Test", "tier": "free"},
		{"password": "pass123", "displayName": "Test", "tier": "free"},
	}

	for i, payload := range tests {
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("test %d: expected status 400, got %d", i, rr.Code)
		}
	}
}

// TestSignIn_InvalidCredentials verifies wrong password rejection
func TestSignIn_InvalidCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	email := "test@example.com"
	wrongPassword := "WrongPassword123"
	correctPassword := "CorrectPassword123"

	hashed, _ := bcrypt.GenerateFromPassword([]byte(correctPassword), bcrypt.DefaultCost)
	repo.users[email] = &models.User{ID: "u1", Email: email, DisplayName: "Tester"}
	repo.passwords[email] = string(hashed)

	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signin", h.SignIn)

	payload := map[string]string{"email": email, "password": wrongPassword}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signin", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}

	var errResp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &errResp)
	if errResp["error"] != "invalid credentials" {
		t.Fatalf("expected 'invalid credentials', got %s", errResp["error"])
	}
}

// TestSignIn_UserNotFound verifies error when user doesn't exist
func TestSignIn_UserNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signin", h.SignIn)

	payload := map[string]string{"email": "nonexistent@example.com", "password": "password123"}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signin", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

// TestSignIn_MissingFields verifies validation of required fields
func TestSignIn_MissingFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/signin", h.SignIn)

	tests := []map[string]string{
		{"email": "test@example.com"},
		{"password": "password123"},
		{},
	}

	for i, payload := range tests {
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/signin", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("test %d: expected status 400, got %d", i, rr.Code)
		}
	}
}

// TestLogout_ClearsAuthCookie verifies logout clears the auth cookie
func TestLogout_ClearsAuthCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.POST("/api/auth/logout", h.Logout)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	resp := rr.Result()
	defer resp.Body.Close()
	cookies := resp.Cookies()

	found := false
	for _, c := range cookies {
		if c.Name == "auth_token" {
			found = true
			if c.MaxAge != -1 {
				t.Fatalf("expected MaxAge -1 to clear cookie, got %d", c.MaxAge)
			}
			if c.Value != "" {
				t.Fatalf("expected empty value for cleared cookie, got %s", c.Value)
			}
			break
		}
	}

	if !found {
		t.Fatalf("auth_token cookie not found in logout response")
	}
}

// TestGetCurrentUser_ValidContext verifies retrieval with valid userID in context
func TestGetCurrentUser_ValidContext(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	userID := "user123"
	user := &models.User{
		ID:          userID,
		Email:       "test@example.com",
		DisplayName: "Test User",
		Tier:        "free",
	}
	repo.users[user.Email] = user

	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.GET("/api/auth/me", func(c *gin.Context) {
		c.Set("userID", userID)
		h.GetCurrentUser(c)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var response models.User
	json.Unmarshal(rr.Body.Bytes(), &response)

	if response.ID != userID {
		t.Fatalf("expected user ID %s, got %s", userID, response.ID)
	}
}

// TestGetCurrentUser_NoUserID verifies 401 when userID missing from context
func TestGetCurrentUser_NoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.GET("/api/auth/me", h.GetCurrentUser)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

// TestCheckEmailAvailability_Available verifies available email check
func TestCheckEmailAvailability_Available(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.GET("/api/auth/check-email", h.CheckEmailAvailability)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/check-email?email=available@example.com", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var response SignUpResponse
	json.Unmarshal(rr.Body.Bytes(), &response)

	if !response.Available {
		t.Fatalf("expected available: true")
	}
}

// TestCheckEmailAvailability_Taken verifies taken email check
func TestCheckEmailAvailability_Taken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	email := "taken@example.com"
	repo.users[email] = &models.User{ID: "u1", Email: email}

	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.GET("/api/auth/check-email", h.CheckEmailAvailability)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/check-email?email="+email, nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var response SignUpResponse
	json.Unmarshal(rr.Body.Bytes(), &response)

	if response.Available {
		t.Fatalf("expected available: false")
	}
}

// TestCheckEmailAvailability_MissingEmail verifies missing email param returns 400
func TestCheckEmailAvailability_MissingEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := newMockUserRepo()
	h := NewAuthHandler(repo, nil)

	router := gin.New()
	router.GET("/api/auth/check-email", h.CheckEmailAvailability)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/check-email", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

// mockPasswordResetRepo implements PasswordResetRepository for testing
type mockPasswordResetRepo struct {
	tokens map[string]struct {
		userID    string
		expiresAt time.Time
	}
}

func newMockPasswordResetRepo() *mockPasswordResetRepo {
	return &mockPasswordResetRepo{
		tokens: map[string]struct {
			userID    string
			expiresAt time.Time
		}{},
	}
}

func (m *mockPasswordResetRepo) Create(userID, token string, expiresAt time.Time) error {
	m.tokens[token] = struct {
		userID    string
		expiresAt time.Time
	}{userID, expiresAt}
	return nil
}

func (m *mockPasswordResetRepo) FindByToken(token string) (string, time.Time, error) {
	if t, ok := m.tokens[token]; ok {
		return t.userID, t.expiresAt, nil
	}
	return "", time.Time{}, fmt.Errorf("token not found")
}

func (m *mockPasswordResetRepo) DeleteByToken(token string) error {
	delete(m.tokens, token)
	return nil
}

// TestResetPassword_ValidToken verifies password reset with valid token
func TestResetPassword_ValidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userRepo := newMockUserRepo()
	prRepo := newMockPasswordResetRepo()

	userID := "user123"
	userRepo.users["user@example.com"] = &models.User{ID: userID, Email: "user@example.com"}

	token := "valid_reset_token"
	expiresAt := time.Now().Add(1 * time.Hour)
	prRepo.Create(userID, token, expiresAt)

	h := NewAuthHandler(userRepo, prRepo)

	router := gin.New()
	router.POST("/api/auth/reset-password", h.ResetPassword)

	newPassword := "NewPassword123"
	payload := map[string]string{
		"token":    token,
		"password": newPassword,
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var response map[string]string
	json.Unmarshal(rr.Body.Bytes(), &response)
	if response["message"] != "password has been reset" {
		t.Fatalf("expected success message")
	}

	// Token should be deleted
	_, _, err := prRepo.FindByToken(token)
	if err == nil {
		t.Fatalf("expected token to be deleted")
	}
}

// TestResetPassword_ExpiredToken verifies rejection of expired token
func TestResetPassword_ExpiredToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userRepo := newMockUserRepo()
	prRepo := newMockPasswordResetRepo()

	userID := "user123"
	userRepo.users["user@example.com"] = &models.User{ID: userID, Email: "user@example.com"}

	token := "expired_token"
	expiresAt := time.Now().Add(-1 * time.Hour) // Past time
	prRepo.Create(userID, token, expiresAt)

	h := NewAuthHandler(userRepo, prRepo)

	router := gin.New()
	router.POST("/api/auth/reset-password", h.ResetPassword)

	payload := map[string]string{
		"token":    token,
		"password": "NewPassword123",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}

	var errResp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &errResp)
	if errResp["error"] != "token expired" {
		t.Fatalf("expected 'token expired' error")
	}
}

// TestResetPassword_InvalidToken verifies rejection of invalid token
func TestResetPassword_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userRepo := newMockUserRepo()
	prRepo := newMockPasswordResetRepo()

	h := NewAuthHandler(userRepo, prRepo)

	router := gin.New()
	router.POST("/api/auth/reset-password", h.ResetPassword)

	payload := map[string]string{
		"token":    "nonexistent_token",
		"password": "NewPassword123",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

// TestResetPassword_ShortPassword verifies password minimum length requirement
func TestResetPassword_ShortPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userRepo := newMockUserRepo()
	prRepo := newMockPasswordResetRepo()

	h := NewAuthHandler(userRepo, prRepo)

	router := gin.New()
	router.POST("/api/auth/reset-password", h.ResetPassword)

	payload := map[string]string{
		"token":    "any_token",
		"password": "short",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

// TestResetPassword_MissingFields verifies validation of required fields
func TestResetPassword_MissingFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userRepo := newMockUserRepo()
	prRepo := newMockPasswordResetRepo()

	h := NewAuthHandler(userRepo, prRepo)

	router := gin.New()
	router.POST("/api/auth/reset-password", h.ResetPassword)

	tests := []map[string]string{
		{"token": "some_token"},
		{"password": "NewPassword123"},
		{},
	}

	for i, payload := range tests {
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("test %d: expected status 400, got %d", i, rr.Code)
		}
	}
}
