package testhelpers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// CreateTestGinContext creates a test Gin context with a response recorder
func CreateTestGinContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	return ctx, recorder
}

// SetUserContext sets userID in Gin context (simulates what auth middleware does)
func SetUserContext(c *gin.Context, userID string) {
	c.Set("userID", userID)
}

// MakeJSONRequest creates an HTTP request with a JSON body
func MakeJSONRequest(method, url string, body interface{}) *http.Request {
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, url, bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	return req
}

// ParseJSONResponse parses a response body into the target interface
func ParseJSONResponse(t *testing.T, recorder *httptest.ResponseRecorder, target interface{}) {
	if err := json.Unmarshal(recorder.Body.Bytes(), target); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}
}

// AssertStatusCode asserts the HTTP response status code matches expected
func AssertStatusCode(t *testing.T, recorder *httptest.ResponseRecorder, expectedCode int) {
	if recorder.Code != expectedCode {
		t.Fatalf("expected status code %d, got %d. Response: %s", expectedCode, recorder.Code, recorder.Body.String())
	}
}

// AssertJSONField asserts a JSON field in response matches expected value
func AssertJSONField(t *testing.T, recorder *httptest.ResponseRecorder, fieldPath string, expected interface{}) {
	var data map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &data)

	if val, ok := data[fieldPath]; !ok {
		t.Fatalf("field %s not found in response", fieldPath)
	} else if val != expected {
		t.Fatalf("field %s: expected %v, got %v", fieldPath, expected, val)
	}
}
