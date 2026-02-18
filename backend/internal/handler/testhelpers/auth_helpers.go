package testhelpers

import (
	"net/http"

	"gaspeep/backend/internal/auth"
)

// CreateTestJWT generates a valid JWT token for testing
func CreateTestJWT(userID, email string) (string, error) {
	return auth.GenerateToken(userID, email)
}

// SetAuthHeader sets the Authorization header on a request with a Bearer token
func SetAuthHeader(req *http.Request, token string) {
	req.Header.Set("Authorization", "Bearer "+token)
}

// SetAuthCookie sets an auth_token cookie on a request
func SetAuthCookie(req *http.Request, token string) {
	req.AddCookie(&http.Cookie{
		Name:     "auth_token",
		Value:    token,
		HttpOnly: true,
		Path:     "/",
	})
}

// CreateTestCookie creates an auth_token cookie for testing
func CreateTestCookie(token string) *http.Cookie {
	return &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		HttpOnly: true,
		Path:     "/",
		MaxAge:   604800, // 7 days
	}
}
