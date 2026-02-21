package handler

import (
	"net/http"
	"os"

	"gaspeep/backend/internal/auth"
	"gaspeep/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OAuthHandler struct {
	userRepo repository.UserRepository
}

var (
	buildGoogleAuthURL = auth.BuildGoogleAuthURL
	exchangeGoogleCode = auth.ExchangeCode
	fetchGoogleProfile = auth.FetchProfile
	generateJWTToken   = auth.GenerateToken
)

func NewOAuthHandler(userRepo repository.UserRepository) *OAuthHandler {
	return &OAuthHandler{userRepo: userRepo}
}

// StartGoogle begins the OAuth flow by redirecting to Google's consent screen.
func (h *OAuthHandler) StartGoogle(c *gin.Context) {
	state := uuid.New().String()
	// set state cookie for basic CSRF protection
	c.SetCookie("oauth_state", state, 300, "/", "", false, true)

	authURL, err := buildGoogleAuthURL(state)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Redirect(http.StatusFound, authURL)
}

// GoogleCallback handles the OAuth callback from Google.
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")
	cookieState, _ := c.Cookie("oauth_state")
	// basic state validation
	if state == "" || cookieState == "" || state != cookieState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state"})
		return
	}

	// Exchange code for tokens
	tr, err := exchangeGoogleCode(code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token exchange failed"})
		return
	}

	// Fetch profile
	profile, err := fetchGoogleProfile(tr.AccessToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to fetch profile"})
		return
	}

	// Try to find user by provider
	user, err := h.userRepo.GetUserByProvider("google", profile.Sub)
	if err != nil {
		// not found => try to find by email
		existing, err2 := h.userRepo.GetUserByEmail(profile.Email)
		if err2 == nil && existing != nil {
			// link existing account
			_ = h.userRepo.UpdateUserOAuth(existing.ID, "google", profile.Sub, profile.Picture, profile.EmailVerified)
			user = existing
		} else {
			// create new user
			u, err3 := h.userRepo.CreateUserWithProvider(profile.Email, profile.Name, "free", "google", profile.Sub, profile.Picture, profile.EmailVerified)
			if err3 != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user error is " + err3.Error()})
				return
			}
			user = u
		}
	}

	// Generate internal JWT
	token, err := generateJWTToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Set auth cookie (HttpOnly). Use env to determine cookie attributes where possible.
	cookieDomain := os.Getenv("AUTH_COOKIE_DOMAIN") // optional, leave empty for host-only cookie

	// Determine secure flag: explicit env takes precedence, then production, then TLS
	secureFlag := false
	if os.Getenv("AUTH_COOKIE_SECURE") == "true" {
		secureFlag = true
	} else if os.Getenv("ENV") == "production" {
		secureFlag = true
	} else if c.Request.TLS != nil {
		secureFlag = true
	}

	// Determine SameSite: in production prefer Lax for better CSRF protection; in dev allow None for popups
	sameSite := http.SameSiteNoneMode
	if os.Getenv("ENV") == "production" {
		sameSite = http.SameSiteLaxMode
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   secureFlag,
		SameSite: sameSite,
		MaxAge:   60 * 60 * 24 * 7, // 7 days
	})

	// Respond with a small HTML page that notifies opener (popup) and closes.
	frontendSuccess := os.Getenv("FRONTEND_OAUTH_SUCCESS_URL")
	if frontendSuccess == "" {
		frontendSuccess = os.Getenv("APP_BASE_URL")
		if frontendSuccess == "" {
			frontendSuccess = "https://dev.gaspeep.com"
		}
		frontendSuccess = frontendSuccess + "/auth/oauth/success"
	}

	html := `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
    try {
        if (window.opener) {
            // Notify opener that oauth succeeded; opener should fetch /api/auth/me
            window.opener.postMessage({ type: 'oauth_success' }, '*');
            window.close();
        } else {
            // No opener - navigate the current window to frontend success
            window.location.href = '` + frontendSuccess + `';
        }
    } catch (e) {
        window.location.href = '` + frontendSuccess + `';
    }
    </script></body></html>`

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
