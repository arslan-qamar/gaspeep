package testhelpers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// AssertHTTPError asserts that a response is an error with the given code and message
func AssertHTTPError(t *testing.T, recorder *httptest.ResponseRecorder, expectedCode int, expectedMessage string) {
	if recorder.Code != expectedCode {
		t.Fatalf("expected status %d, got %d. Body: %s", expectedCode, recorder.Code, recorder.Body.String())
	}

	var errResp map[string]string
	if err := json.Unmarshal(recorder.Body.Bytes(), &errResp); err != nil {
		t.Fatalf("failed to parse error response: %v", err)
	}

	if errResp["error"] != expectedMessage {
		t.Fatalf("expected error message %q, got %q", expectedMessage, errResp["error"])
	}
}

// AssertCookieExists asserts that a cookie with the given name exists in the response
func AssertCookieExists(t *testing.T, resp *http.Response, cookieName string) *http.Cookie {
	for _, c := range resp.Cookies() {
		if c.Name == cookieName {
			return c
		}
	}
	t.Fatalf("cookie %q not found in response", cookieName)
	return nil
}

// AssertCookieAttributes asserts that a cookie has the expected attributes
func AssertCookieAttributes(t *testing.T, cookie *http.Cookie, httpOnly, secure bool, sameSite http.SameSite) {
	if cookie.HttpOnly != httpOnly {
		t.Fatalf("expected HttpOnly=%v, got %v", httpOnly, cookie.HttpOnly)
	}

	if cookie.Secure != secure {
		t.Fatalf("expected Secure=%v, got %v", secure, cookie.Secure)
	}

	if cookie.SameSite != sameSite {
		t.Fatalf("expected SameSite=%v, got %v", sameSite, cookie.SameSite)
	}
}

// AssertPaginationResponse asserts that the response contains valid pagination metadata
func AssertPaginationResponse(t *testing.T, data map[string]interface{}, expectedPage, expectedLimit, expectedTotal int) {
	pagination, ok := data["pagination"].(map[string]interface{})
	if !ok {
		t.Fatalf("pagination metadata not found in response")
	}

	page := int(pagination["page"].(float64))
	limit := int(pagination["limit"].(float64))
	total := int(pagination["total"].(float64))

	if page != expectedPage {
		t.Fatalf("expected page %d, got %d", expectedPage, page)
	}

	if limit != expectedLimit {
		t.Fatalf("expected limit %d, got %d", expectedLimit, limit)
	}

	if total != expectedTotal {
		t.Fatalf("expected total %d, got %d", expectedTotal, total)
	}
}

// AssertJSONResponse asserts the status code and parses JSON response
func AssertJSONResponse(t *testing.T, recorder *httptest.ResponseRecorder, expectedCode int, target interface{}) {
	if recorder.Code != expectedCode {
		t.Fatalf("expected status %d, got %d. Body: %s", expectedCode, recorder.Code, recorder.Body.String())
	}

	if err := json.Unmarshal(recorder.Body.Bytes(), target); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}
}

// AssertCookieCleared asserts that a cookie is cleared (MaxAge=-1, empty value)
func AssertCookieCleared(t *testing.T, cookie *http.Cookie) {
	if cookie.MaxAge != -1 {
		t.Fatalf("expected MaxAge=-1 for cleared cookie, got %d", cookie.MaxAge)
	}

	if cookie.Value != "" {
		t.Fatalf("expected empty value for cleared cookie, got %q", cookie.Value)
	}
}
