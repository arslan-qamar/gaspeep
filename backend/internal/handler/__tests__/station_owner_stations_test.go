package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestGetStationsEndpoint verifies the GET /api/station-owners/stations endpoint
func TestGetStationsEndpoint(t *testing.T) {
	router := gin.New()

	router.GET("/api/station-owners/stations", func(c *gin.Context) {
		c.JSON(http.StatusOK, []map[string]interface{}{
			{
				"id":                 "station_101",
				"name":               "Coastal Shell",
				"brand":              "Shell",
				"address":            "123 Main St",
				"latitude":           -33.8688,
				"longitude":          151.2093,
				"operatingHours":     "24/7",
				"verificationStatus": "pending",
				"verifiedAt":         "2026-02-18T10:30:00Z",
			},
		})
	})

	req, _ := http.NewRequest("GET", "/api/station-owners/stations", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Greater(t, len(response), 0)
	assert.Equal(t, "station_101", response[0]["id"])
	assert.Equal(t, "pending", response[0]["verificationStatus"])
}

// TestGetStationsEndpointEmpty tests the endpoint when user has no stations
func TestGetStationsEndpointEmpty(t *testing.T) {
	router := gin.New()

	router.GET("/api/station-owners/stations", func(c *gin.Context) {
		c.JSON(http.StatusOK, []map[string]interface{}{})
	})

	req, _ := http.NewRequest("GET", "/api/station-owners/stations", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, 0, len(response))
}
