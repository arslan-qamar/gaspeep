package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"gaspeep/backend/internal/auth"
	"gaspeep/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func withOAuthStubs(t *testing.T, build func(string) (string, error), exchange func(string) (*auth.GoogleTokenResponse, error), fetch func(string) (*auth.GoogleProfile, error), gen func(string, string) (string, error)) {
	t.Helper()
	origBuild := buildGoogleAuthURL
	origExchange := exchangeGoogleCode
	origFetch := fetchGoogleProfile
	origGen := generateJWTToken

	if build != nil {
		buildGoogleAuthURL = build
	}
	if exchange != nil {
		exchangeGoogleCode = exchange
	}
	if fetch != nil {
		fetchGoogleProfile = fetch
	}
	if gen != nil {
		generateJWTToken = gen
	}

	t.Cleanup(func() {
		buildGoogleAuthURL = origBuild
		exchangeGoogleCode = origExchange
		fetchGoogleProfile = origFetch
		generateJWTToken = origGen
	})
}

func TestGoogleCallback_ProviderUserSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockRepo := new(MockUserRepositoryOAuth)
	h := NewOAuthHandler(mockRepo)

	withOAuthStubs(t,
		nil,
		func(code string) (*auth.GoogleTokenResponse, error) {
			return &auth.GoogleTokenResponse{AccessToken: "token"}, nil
		},
		func(accessToken string) (*auth.GoogleProfile, error) {
			return &auth.GoogleProfile{Sub: "google-sub", Email: "a@b.com", Name: "A", Picture: "pic", EmailVerified: true}, nil
		},
		func(userID, email string) (string, error) {
			return "jwt-token", nil
		},
	)

	mockRepo.On("GetUserByProvider", "google", "google-sub").Return(&models.User{ID: "u1", Email: "a@b.com"}, nil).Once()

	r := gin.New()
	r.GET("/oauth/callback", h.GoogleCallback)

	req := httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "oauth_success")
	cookies := w.Result().Cookies()
	foundAuth := false
	for _, c := range cookies {
		if c.Name == "auth_token" && c.Value == "jwt-token" {
			foundAuth = true
		}
	}
	assert.True(t, foundAuth)
	mockRepo.AssertExpectations(t)
}

func TestGoogleCallback_LinkExistingUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockRepo := new(MockUserRepositoryOAuth)
	h := NewOAuthHandler(mockRepo)

	withOAuthStubs(t,
		nil,
		func(code string) (*auth.GoogleTokenResponse, error) {
			return &auth.GoogleTokenResponse{AccessToken: "token"}, nil
		},
		func(accessToken string) (*auth.GoogleProfile, error) {
			return &auth.GoogleProfile{Sub: "google-sub", Email: "a@b.com", Name: "A", Picture: "pic", EmailVerified: true}, nil
		},
		func(userID, email string) (string, error) {
			return "jwt-token", nil
		},
	)

	existing := &models.User{ID: "u-existing", Email: "a@b.com"}
	mockRepo.On("GetUserByProvider", "google", "google-sub").Return(nil, errors.New("not found")).Once()
	mockRepo.On("GetUserByEmail", "a@b.com").Return(existing, nil).Once()
	mockRepo.On("UpdateUserOAuth", "u-existing", "google", "google-sub", "pic", true).Return(nil).Once()

	r := gin.New()
	r.GET("/oauth/callback", h.GoogleCallback)
	req := httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestGoogleCallback_CreateUserFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockRepo := new(MockUserRepositoryOAuth)
	h := NewOAuthHandler(mockRepo)

	withOAuthStubs(t,
		nil,
		func(code string) (*auth.GoogleTokenResponse, error) {
			return &auth.GoogleTokenResponse{AccessToken: "token"}, nil
		},
		func(accessToken string) (*auth.GoogleProfile, error) {
			return &auth.GoogleProfile{Sub: "google-sub", Email: "new@b.com", Name: "New", Picture: "pic", EmailVerified: true}, nil
		},
		func(userID, email string) (string, error) {
			return "jwt-token", nil
		},
	)

	mockRepo.On("GetUserByProvider", "google", "google-sub").Return(nil, errors.New("not found")).Once()
	mockRepo.On("GetUserByEmail", "new@b.com").Return(nil, errors.New("not found")).Once()
	mockRepo.On("CreateUserWithProvider", "new@b.com", "New", "free", "google", "google-sub", "pic", true).Return(nil, errors.New("create failed")).Once()

	r := gin.New()
	r.GET("/oauth/callback", h.GoogleCallback)
	req := httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "failed to create user")
	mockRepo.AssertExpectations(t)
}

func TestGoogleCallback_ProfileFetchAndJWTFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockRepo := new(MockUserRepositoryOAuth)
	h := NewOAuthHandler(mockRepo)

	// Fetch profile failure path
	withOAuthStubs(t,
		nil,
		func(code string) (*auth.GoogleTokenResponse, error) {
			return &auth.GoogleTokenResponse{AccessToken: "token"}, nil
		},
		func(accessToken string) (*auth.GoogleProfile, error) {
			return nil, errors.New("profile failed")
		},
		func(userID, email string) (string, error) {
			return "jwt-token", nil
		},
	)

	r := gin.New()
	r.GET("/oauth/callback", h.GoogleCallback)
	req := httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// JWT generation failure path
	withOAuthStubs(t,
		nil,
		func(code string) (*auth.GoogleTokenResponse, error) {
			return &auth.GoogleTokenResponse{AccessToken: "token"}, nil
		},
		func(accessToken string) (*auth.GoogleProfile, error) {
			return &auth.GoogleProfile{Sub: "google-sub", Email: "a@b.com", Name: "A", Picture: "pic", EmailVerified: true}, nil
		},
		func(userID, email string) (string, error) {
			return "", errors.New("jwt failed")
		},
	)
	mockRepo.On("GetUserByProvider", "google", "google-sub").Return(&models.User{ID: "u1", Email: "a@b.com"}, nil).Once()

	req = httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "failed to generate token")
	mockRepo.AssertExpectations(t)
}

func TestGoogleCallback_TokenExchangeFailureWithStub(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockRepo := new(MockUserRepositoryOAuth)
	h := NewOAuthHandler(mockRepo)

	withOAuthStubs(t,
		nil,
		func(code string) (*auth.GoogleTokenResponse, error) {
			return nil, errors.New("exchange failed")
		},
		func(accessToken string) (*auth.GoogleProfile, error) {
			return nil, nil
		},
		func(userID, email string) (string, error) {
			return "", nil
		},
	)

	r := gin.New()
	r.GET("/oauth/callback", h.GoogleCallback)
	req := httptest.NewRequest(http.MethodGet, "/oauth/callback?code=abc&state=s1", nil)
	req.AddCookie(&http.Cookie{Name: "oauth_state", Value: "s1"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "token exchange failed")

	mockRepo.AssertNotCalled(t, "GetUserByProvider", mock.Anything, mock.Anything)
}
