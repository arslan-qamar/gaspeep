package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOAuthHandlerStartGoogle_ConfigMissing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("GOOGLE_OAUTH_ID", "")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "")

	h := NewOAuthHandler(new(MockUserRepositoryOAuth))
	r := gin.New()
	r.GET("/oauth/google", h.StartGoogle)

	req := httptest.NewRequest(http.MethodGet, "/oauth/google", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "not configured")
}

func TestOAuthHandlerStartGoogle_RedirectsAndSetsStateCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("GOOGLE_OAUTH_ID", "client-id")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://example.com/callback")

	h := NewOAuthHandler(new(MockUserRepositoryOAuth))
	r := gin.New()
	r.GET("/oauth/google", h.StartGoogle)

	req := httptest.NewRequest(http.MethodGet, "/oauth/google", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)
	location := w.Header().Get("Location")
	assert.Contains(t, location, "accounts.google.com")
	assert.Contains(t, location, "client_id=client-id")
	assert.Contains(t, location, "redirect_uri=https%3A%2F%2Fexample.com%2Fcallback")

	cookies := w.Result().Cookies()
	require.NotEmpty(t, cookies)
	foundState := false
	for _, c := range cookies {
		if c.Name == "oauth_state" {
			foundState = true
			assert.NotEmpty(t, c.Value)
			assert.True(t, c.HttpOnly)
		}
	}
	assert.True(t, foundState)
}

func TestOAuthHandlerGoogleCallback_TokenExchangeFails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	// Intentionally omit GOOGLE_OAUTH_SECRET to force ExchangeCode config error without external network call.
	t.Setenv("GOOGLE_OAUTH_ID", "client-id")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://example.com/callback")
	t.Setenv("GOOGLE_OAUTH_SECRET", "")

	h := NewOAuthHandler(new(MockUserRepositoryOAuth))
	r := gin.New()
	r.GET("/oauth/callback", h.GoogleCallback)

	req := httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc123&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "token exchange failed")
}

func TestServiceNSWSyncHandler_TriggerSync_FailedDependency(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Case 1: disabled
	t.Setenv("SERVICE_NSW_SYNC_ENABLED", "false")
	t.Setenv("SERVICE_NSW_API_KEY", "")
	t.Setenv("SERVICE_NSW_API_SECRET", "")

	svc := service.NewServiceNSWSyncService(nil)
	h := NewServiceNSWSyncHandler(svc)
	r := gin.New()
	r.POST("/sync", h.TriggerSync)

	req := httptest.NewRequest(http.MethodPost, "/sync", strings.NewReader(`{"mode":"full"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusFailedDependency, w.Code)
	assert.Contains(t, w.Body.String(), "disabled")

	// Case 2: enabled but not configured (missing key/secret)
	t.Setenv("SERVICE_NSW_SYNC_ENABLED", "true")
	t.Setenv("SERVICE_NSW_API_KEY", "")
	t.Setenv("SERVICE_NSW_API_SECRET", "")

	svc2 := service.NewServiceNSWSyncService(nil)
	h2 := NewServiceNSWSyncHandler(svc2)
	r2 := gin.New()
	r2.POST("/sync", h2.TriggerSync)

	req = httptest.NewRequest(http.MethodPost, "/sync", strings.NewReader(`{"mode":" incremental "}`))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r2.ServeHTTP(w, req)
	assert.Equal(t, http.StatusFailedDependency, w.Code)
	assert.Contains(t, w.Body.String(), "not configured")
}
