package auth

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func newHTTPResponse(statusCode int, body string) *http.Response {
	return &http.Response{
		StatusCode: statusCode,
		Status:     http.StatusText(statusCode),
		Body:       io.NopCloser(strings.NewReader(body)),
		Header:     make(http.Header),
	}
}

func TestGenerateAndValidateToken_RoundTrip(t *testing.T) {
	token, err := GenerateToken("user-1", "user@example.com")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.UserID != "user-1" {
		t.Fatalf("expected user-1, got %q", claims.UserID)
	}
	if claims.Email != "user@example.com" {
		t.Fatalf("expected user@example.com, got %q", claims.Email)
	}
}

func TestValidateToken_InvalidToken(t *testing.T) {
	_, err := ValidateToken("not-a-jwt")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestValidateToken_UnexpectedSigningMethod(t *testing.T) {
	claims := Claims{UserID: "u", Email: "e@example.com"}
	tok := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	tokenString, err := tok.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("failed to sign none token: %v", err)
	}

	_, err = ValidateToken(tokenString)
	if err == nil {
		t.Fatal("expected signing method error")
	}
	if !strings.Contains(err.Error(), "unexpected signing method") {
		t.Fatalf("expected signing method error, got: %v", err)
	}
}

func TestBuildGoogleAuthURL_MissingConfig(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "")

	_, err := BuildGoogleAuthURL("state")
	if err == nil {
		t.Fatal("expected missing config error")
	}
}

func TestBuildGoogleAuthURL_Success(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "client-id")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://app.example.com/callback")

	u, err := BuildGoogleAuthURL("xyz")
	if err != nil {
		t.Fatalf("BuildGoogleAuthURL failed: %v", err)
	}

	parsed, err := url.Parse(u)
	if err != nil {
		t.Fatalf("failed to parse url: %v", err)
	}
	q := parsed.Query()
	if parsed.Host != "accounts.google.com" {
		t.Fatalf("unexpected host: %s", parsed.Host)
	}
	if q.Get("client_id") != "client-id" {
		t.Fatalf("unexpected client_id: %q", q.Get("client_id"))
	}
	if q.Get("redirect_uri") != "https://app.example.com/callback" {
		t.Fatalf("unexpected redirect_uri: %q", q.Get("redirect_uri"))
	}
	if q.Get("state") != "xyz" {
		t.Fatalf("unexpected state: %q", q.Get("state"))
	}
}

func TestExchangeCode_MissingConfig(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "")
	t.Setenv("GOOGLE_OAUTH_SECRET", "")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "")

	_, err := ExchangeCode("code")
	if err == nil {
		t.Fatal("expected missing config error")
	}
}

func TestExchangeCode_Success(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "cid")
	t.Setenv("GOOGLE_OAUTH_SECRET", "csecret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://app.example.com/callback")

	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })

	hit := false
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		hit = true
		if req.URL.String() != googleTokenEndpoint {
			t.Fatalf("unexpected endpoint: %s", req.URL.String())
		}
		if req.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", req.Method)
		}
		payload, err := io.ReadAll(req.Body)
		if err != nil {
			t.Fatalf("failed reading body: %v", err)
		}
		values, err := url.ParseQuery(string(payload))
		if err != nil {
			t.Fatalf("failed parsing body: %v", err)
		}
		if values.Get("code") != "auth-code" {
			t.Fatalf("unexpected code: %q", values.Get("code"))
		}
		return newHTTPResponse(http.StatusOK, `{"access_token":"a","expires_in":3600,"token_type":"Bearer","id_token":"id"}`), nil
	})

	resp, err := ExchangeCode("auth-code")
	if err != nil {
		t.Fatalf("ExchangeCode failed: %v", err)
	}
	if !hit {
		t.Fatal("expected http transport to be hit")
	}
	if resp.AccessToken != "a" {
		t.Fatalf("unexpected access token: %q", resp.AccessToken)
	}
	if resp.IDToken != "id" {
		t.Fatalf("unexpected id token: %q", resp.IDToken)
	}
}

func TestExchangeCode_Non200(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "cid")
	t.Setenv("GOOGLE_OAUTH_SECRET", "csecret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://app.example.com/callback")

	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusBadRequest, `{"error":"bad_request"}`), nil
	})

	_, err := ExchangeCode("bad")
	if err == nil {
		t.Fatal("expected exchange failure")
	}
}

func TestExchangeCode_DecodeError(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "cid")
	t.Setenv("GOOGLE_OAUTH_SECRET", "csecret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://app.example.com/callback")

	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusOK, `{not-json}`), nil
	})

	_, err := ExchangeCode("code")
	if err == nil {
		t.Fatal("expected decode error")
	}
}

func TestExchangeCode_HTTPError(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_ID", "cid")
	t.Setenv("GOOGLE_OAUTH_SECRET", "csecret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT", "https://app.example.com/callback")

	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return nil, errors.New("network down")
	})

	_, err := ExchangeCode("code")
	if err == nil {
		t.Fatal("expected http error")
	}
}

func TestFetchProfile_Success(t *testing.T) {
	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })

	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		if req.URL.String() != googleUserInfo {
			t.Fatalf("unexpected endpoint: %s", req.URL.String())
		}
		if got := req.Header.Get("Authorization"); got != "Bearer access-token" {
			t.Fatalf("unexpected authorization header: %q", got)
		}
		profile := GoogleProfile{Sub: "123", Email: "u@example.com", Name: "User", Picture: "pic", EmailVerified: true}
		buf, _ := json.Marshal(profile)
		return newHTTPResponse(http.StatusOK, string(buf)), nil
	})

	p, err := FetchProfile("access-token")
	if err != nil {
		t.Fatalf("FetchProfile failed: %v", err)
	}
	if p.Sub != "123" || p.Email != "u@example.com" {
		t.Fatalf("unexpected profile: %+v", p)
	}
}

func TestFetchProfile_HTTPError(t *testing.T) {
	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return nil, errors.New("network down")
	})

	_, err := FetchProfile("token")
	if err == nil {
		t.Fatal("expected profile http error")
	}
}

func TestFetchProfile_Non200(t *testing.T) {
	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusUnauthorized, `{"error":"unauthorized"}`), nil
	})

	_, err := FetchProfile("token")
	if err == nil {
		t.Fatal("expected profile fetch failure")
	}
}

func TestFetchProfile_DecodeError(t *testing.T) {
	orig := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = orig })
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusOK, `{bad-json}`), nil
	})

	_, err := FetchProfile("token")
	if err == nil {
		t.Fatal("expected decode error")
	}
}
