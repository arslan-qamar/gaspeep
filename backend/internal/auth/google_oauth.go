package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
)

const (
    googleAuthEndpoint  = "https://accounts.google.com/o/oauth2/v2/auth"
    googleTokenEndpoint = "https://oauth2.googleapis.com/token"
    googleUserInfo      = "https://openidconnect.googleapis.com/v1/userinfo"
)

type GoogleTokenResponse struct {
    AccessToken string `json:"access_token"`
    ExpiresIn   int    `json:"expires_in"`
    TokenType   string `json:"token_type"`
    IDToken     string `json:"id_token"`
    RefreshToken string `json:"refresh_token,omitempty"`
}

type GoogleProfile struct {
    Sub           string `json:"sub"`
    Email         string `json:"email"`
    Name          string `json:"name"`
    Picture       string `json:"picture"`
    EmailVerified bool   `json:"email_verified"`
}

// BuildGoogleAuthURL constructs the Google OAuth consent URL for the provided redirect and state.
func BuildGoogleAuthURL(state string) (string, error) {
    clientID := os.Getenv("GOOGLE_OAUTH_ID")
    redirect := os.Getenv("GOOGLE_OAUTH_REDIRECT")
    if clientID == "" || redirect == "" {
        return "", fmt.Errorf("google oauth client id or redirect not configured")
    }

    q := url.Values{}
    q.Set("client_id", clientID)
    q.Set("redirect_uri", redirect)
    q.Set("response_type", "code")
    q.Set("scope", "openid email profile")
    q.Set("access_type", "offline")
    q.Set("prompt", "consent")
    if state != "" {
        q.Set("state", state)
    }

    return googleAuthEndpoint + "?" + q.Encode(), nil
}

// ExchangeCode exchanges an authorization code for tokens.
func ExchangeCode(code string) (*GoogleTokenResponse, error) {
    clientID := os.Getenv("GOOGLE_OAUTH_ID")
    clientSecret := os.Getenv("GOOGLE_OAUTH_SECRET")
    redirect := os.Getenv("GOOGLE_OAUTH_REDIRECT")
    if clientID == "" || clientSecret == "" || redirect == "" {
        return nil, fmt.Errorf("google oauth config missing")
    }

    data := url.Values{}
    data.Set("code", code)
    data.Set("client_id", clientID)
    data.Set("client_secret", clientSecret)
    data.Set("redirect_uri", redirect)
    data.Set("grant_type", "authorization_code")

    resp, err := http.Post(googleTokenEndpoint, "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("token exchange failed: %s", resp.Status)
    }

    var tr GoogleTokenResponse
    if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
        return nil, err
    }

    return &tr, nil
}

// FetchProfile uses the access token to fetch the user's profile information.
func FetchProfile(accessToken string) (*GoogleProfile, error) {
    req, err := http.NewRequest("GET", googleUserInfo, nil)
    if err != nil {
        return nil, err
    }
    req.Header.Set("Authorization", "Bearer "+accessToken)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("failed to fetch profile: %s", resp.Status)
    }

    var p GoogleProfile
    if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
        return nil, err
    }

    return &p, nil
}
