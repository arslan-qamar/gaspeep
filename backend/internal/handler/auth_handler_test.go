package handler
package handler

import (
    "bytes"
    "encoding/json"
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
func (m *mockUserRepo) GetUserByProvider(provider, providerID string) (*models.User, error) { return nil, nil }
func (m *mockUserRepo) GetUserByEmail(email string) (*models.User, error) {
    if u, ok := m.users[email]; ok {
        return u, nil
    }
    return nil, nil
}
func (m *mockUserRepo) GetUserByID(id string) (*models.User, error) { return nil, nil }
func (m *mockUserRepo) UpdateUserOAuth(userID, provider, providerID, avatarURL string, emailVerified bool) error { return nil }
func (m *mockUserRepo) GetPasswordHash(email string) (string, error) {
    if h, ok := m.passwords[email]; ok {
        return h, nil
    }
    return "", nil
}
func (m *mockUserRepo) UpdateUserTier(userID, tier string) error { return nil }
func (m *mockUserRepo) UpdatePassword(userID, passwordHash string) error { return nil }
func (m *mockUserRepo) GetUserIDByEmail(email string) (string, error) { return "", nil }
func (m *mockUserRepo) UpdateProfile(userID, displayName, tier string) (string, error) { return "", nil }

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
