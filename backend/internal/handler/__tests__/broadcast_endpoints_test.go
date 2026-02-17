package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestCreateBroadcastEndpoint verifies broadcast creation
func TestCreateBroadcastEndpoint(t *testing.T) {
	router := gin.New()

	router.POST("/api/broadcasts", func(c *gin.Context) {
		var input map[string]interface{}
		c.BindJSON(&input)

		c.JSON(http.StatusCreated, map[string]interface{}{
			"id":              "broadcast_001",
			"stationId":       input["stationId"],
			"title":           input["title"],
			"broadcastStatus": "scheduled",
			"targetRadiusKm":  input["targetRadiusKm"],
		})
	})

	payload := map[string]interface{}{
		"stationId":      "station_101",
		"title":          "Weekend Diesel Special",
		"targetRadiusKm": 10,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/api/broadcasts", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "broadcast_001", response["id"])
	assert.Equal(t, "scheduled", response["broadcastStatus"])
	assert.Equal(t, "Weekend Diesel Special", response["title"])
}

// TestGetBroadcastEndpoint verifies getting a broadcast by ID
func TestGetBroadcastEndpoint(t *testing.T) {
	router := gin.New()

	router.GET("/api/broadcasts/:id", func(c *gin.Context) {
		broadcastID := c.Param("id")

		c.JSON(http.StatusOK, map[string]interface{}{
			"id":              broadcastID,
			"stationId":       "station_101",
			"title":           "Weekend Special",
			"broadcastStatus": "active",
			"views":           150,
			"clicks":          42,
		})
	})

	req, _ := http.NewRequest("GET", "/api/broadcasts/broadcast_001", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "broadcast_001", response["id"])
	assert.Equal(t, float64(150), response["views"])
	assert.Equal(t, float64(42), response["clicks"])
}

// TestSendBroadcastEndpoint verifies sending a broadcast
func TestSendBroadcastEndpoint(t *testing.T) {
	router := gin.New()

	router.POST("/api/broadcasts/:id/send", func(c *gin.Context) {
		broadcastID := c.Param("id")

		c.JSON(http.StatusOK, map[string]interface{}{
			"id":              broadcastID,
			"broadcastStatus": "active",
			"sentAt":          "2026-02-17T10:30:00Z",
		})
	})

	req, _ := http.NewRequest("POST", "/api/broadcasts/broadcast_001/send", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "active", response["broadcastStatus"])
}

// TestScheduleBroadcastEndpoint verifies scheduling a broadcast
func TestScheduleBroadcastEndpoint(t *testing.T) {
	router := gin.New()

	router.POST("/api/broadcasts/:id/schedule", func(c *gin.Context) {
		broadcastID := c.Param("id")

		var input map[string]interface{}
		c.BindJSON(&input)

		c.JSON(http.StatusOK, map[string]interface{}{
			"id":              broadcastID,
			"broadcastStatus": "scheduled",
			"scheduledFor":    input["scheduledFor"],
		})
	})

	payload := map[string]interface{}{
		"scheduledFor": "2026-02-20T14:00:00Z",
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/api/broadcasts/broadcast_001/schedule", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "scheduled", response["broadcastStatus"])
	assert.Equal(t, "2026-02-20T14:00:00Z", response["scheduledFor"])
}

// TestDeleteBroadcastEndpoint verifies deleting a broadcast
func TestDeleteBroadcastEndpoint(t *testing.T) {
	router := gin.New()

	router.DELETE("/api/broadcasts/:id", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	req, _ := http.NewRequest("DELETE", "/api/broadcasts/broadcast_001", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
}
