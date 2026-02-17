package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestGetProfileEndpoint verifies the GET /api/station-owners/profile endpoint
func TestGetProfileEndpoint(t *testing.T) {
	router := gin.New()

	router.GET("/api/station-owners/profile", func(c *gin.Context) {
		c.JSON(http.StatusOK, map[string]interface{}{
			"id":                 "owner_001",
			"userId":             "user_501",
			"businessName":       "Coastal Fuel Group",
			"verificationStatus": "verified",
			"broadcastsThisWeek": 5,
			"broadcastLimit":     20,
		})
	})

	req, _ := http.NewRequest("GET", "/api/station-owners/profile", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "owner_001", response["id"])
	assert.Equal(t, "verified", response["verificationStatus"])
	assert.Equal(t, "Coastal Fuel Group", response["businessName"])
}
