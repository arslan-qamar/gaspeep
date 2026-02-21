package middleware

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"gaspeep/backend/internal/auth"

	"github.com/gin-gonic/gin"
)

func TestCORSMiddleware_AllowlistMatch(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://allowed.example.com,https://other.example.com")
	t.Setenv("ENV", "production")
	t.Setenv("APP_BASE_URL", "https://app.example.com")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://allowed.example.com")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://allowed.example.com" {
		t.Fatalf("expected allow origin header to match request origin, got %q", got)
	}
	if got := w.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("expected credentials header true, got %q", got)
	}
}

func TestCORSMiddleware_DevelopmentEchoOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CORS_ALLOWED_ORIGINS", "")
	t.Setenv("ENV", "development")
	t.Setenv("APP_BASE_URL", "")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://dev.local")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://dev.local" {
		t.Fatalf("expected dev mode to echo origin, got %q", got)
	}
}

func TestCORSMiddleware_ProductionUsesAppBaseURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CORS_ALLOWED_ORIGINS", "")
	t.Setenv("ENV", "production")
	t.Setenv("APP_BASE_URL", "https://app.example.com")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://unknown.example.com")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://app.example.com" {
		t.Fatalf("expected production fallback APP_BASE_URL, got %q", got)
	}
}

func TestCORSMiddleware_NoMatchSetsVaryOnly(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://allowed.example.com")
	t.Setenv("ENV", "production")
	t.Setenv("APP_BASE_URL", "")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://not-allowed.example.com")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected no allow origin header when no match, got %q", got)
	}
	if got := w.Header().Get("Vary"); got != "Origin" {
		t.Fatalf("expected Vary=Origin, got %q", got)
	}
}

func TestCORSMiddleware_OptionsRequestReturnsNoContent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://allowed.example.com")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.OPTIONS("/", func(c *gin.Context) {
		c.Status(http.StatusTeapot)
	})

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://allowed.example.com")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for preflight, got %d", w.Code)
	}
}

func TestErrorHandlingMiddleware_UsesWriterStatusWhenNotOK(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(ErrorHandlingMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusBadRequest)
		_ = c.Error(errors.New("boom"))
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("expected JSON error response, got unmarshal error: %v", err)
	}
	if body["error"] != "boom" {
		t.Fatalf("expected error message boom, got %q", body["error"])
	}
	if body["status"] != "error" {
		t.Fatalf("expected status field error, got %q", body["status"])
	}
}

func TestErrorHandlingMiddleware_DefaultsToInternalServerError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(ErrorHandlingMiddleware())
	r.GET("/", func(c *gin.Context) {
		_ = c.Error(errors.New("unexpected"))
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when writer status is 200, got %d", w.Code)
	}
}

func TestAuthMiddleware_MissingToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer not-a-valid-token")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for invalid token, got %d", w.Code)
	}
}

func TestAuthMiddleware_ValidBearerTokenSetsContext(t *testing.T) {
	gin.SetMode(gin.TestMode)

	token, err := auth.GenerateToken("user-123", "user@example.com")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/", func(c *gin.Context) {
		userID, _ := c.Get("userID")
		email, _ := c.Get("email")
		c.JSON(http.StatusOK, gin.H{"userID": userID, "email": email})
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if body["userID"] != "user-123" {
		t.Fatalf("expected userID user-123, got %q", body["userID"])
	}
	if body["email"] != "user@example.com" {
		t.Fatalf("expected email user@example.com, got %q", body["email"])
	}
}

func TestAuthMiddleware_UsesCookieTokenFallback(t *testing.T) {
	gin.SetMode(gin.TestMode)

	token, err := auth.GenerateToken("cookie-user", "cookie@example.com")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 from cookie fallback, got %d", w.Code)
	}
}

func TestServiceNSWSyncAuthMiddleware_MissingCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("SERVICE_NSW_API_KEY", "")
	t.Setenv("SERVICE_NSW_API_SECRET", "")

	r := gin.New()
	r.Use(ServiceNSWSyncAuthMiddleware())
	r.POST("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusFailedDependency {
		t.Fatalf("expected 424, got %d", w.Code)
	}
}

func TestServiceNSWSyncAuthMiddleware_MissingAuthorizationHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("SERVICE_NSW_API_KEY", "api-key")
	t.Setenv("SERVICE_NSW_API_SECRET", "api-secret")

	r := gin.New()
	r.Use(ServiceNSWSyncAuthMiddleware())
	r.POST("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestServiceNSWSyncAuthMiddleware_RejectsInvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("SERVICE_NSW_API_KEY", "api-key")
	t.Setenv("SERVICE_NSW_API_SECRET", "api-secret")

	r := gin.New()
	r.Use(ServiceNSWSyncAuthMiddleware())
	r.POST("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Authorization", "Bearer wrong-token")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestServiceNSWSyncAuthMiddleware_AcceptsBearerAndBasic(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("SERVICE_NSW_API_KEY", "api-key")
	t.Setenv("SERVICE_NSW_API_SECRET", "api-secret")

	expected := base64.StdEncoding.EncodeToString([]byte("api-key:api-secret"))

	r := gin.New()
	r.Use(ServiceNSWSyncAuthMiddleware())
	r.POST("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	bearerReq := httptest.NewRequest(http.MethodPost, "/", nil)
	bearerReq.Header.Set("Authorization", "Bearer "+expected)
	bearerW := httptest.NewRecorder()
	r.ServeHTTP(bearerW, bearerReq)
	if bearerW.Code != http.StatusOK {
		t.Fatalf("expected 200 for bearer token, got %d", bearerW.Code)
	}

	basicReq := httptest.NewRequest(http.MethodPost, "/", nil)
	basicReq.Header.Set("Authorization", "Basic "+expected)
	basicW := httptest.NewRecorder()
	r.ServeHTTP(basicW, basicReq)
	if basicW.Code != http.StatusOK {
		t.Fatalf("expected 200 for basic token, got %d", basicW.Code)
	}
}
