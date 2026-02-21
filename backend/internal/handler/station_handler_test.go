package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"gaspeep/backend/internal/models"
	testhelpers "gaspeep/backend/internal/handler/testhelpers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestSearchStationsNearby_PassesMaxPriceAsCents(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := new(testhelpers.MockStationService)
	handler := NewStationHandler(mockService)
	router := gin.New()
	router.POST("/api/stations/search-nearby", handler.SearchStationsNearby)

	payload := map[string]interface{}{
		"latitude":  -33.8688,
		"longitude": 151.2093,
		"radiusKm":  5,
		"maxPrice":  199.9,
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	mockService.
		On("SearchStationsNearby", -33.8688, 151.2093, 5, "", mock.Anything, 199.9).
		Return([]models.Station{}, nil).
		Once()

	req := httptest.NewRequest(http.MethodPost, "/api/stations/search-nearby", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	mockService.AssertExpectations(t)
}

func TestSearchStationsNearby_PassesWholeNumberCentsMaxPrice(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := new(testhelpers.MockStationService)
	handler := NewStationHandler(mockService)
	router := gin.New()
	router.POST("/api/stations/search-nearby", handler.SearchStationsNearby)

	payload := map[string]interface{}{
		"latitude":  -33.8688,
		"longitude": 151.2093,
		"radiusKm":  5,
		"maxPrice":  200.0,
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	mockService.
		On("SearchStationsNearby", -33.8688, 151.2093, 5, "", mock.Anything, 200.0).
		Return([]models.Station{}, nil).
		Once()

	req := httptest.NewRequest(http.MethodPost, "/api/stations/search-nearby", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	mockService.AssertExpectations(t)
}
