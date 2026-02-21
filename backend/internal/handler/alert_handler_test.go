package handler

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	testhelpers "gaspeep/backend/internal/handler/testhelpers"
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func authedRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	})
	return r
}

func TestNewAlertHandler(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	require.NotNil(t, h)
}

func TestAlertHandlerCreateAlertDefaults(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.POST("/alerts", h.CreateAlert)

	alert := &models.Alert{ID: "a1", AlertName: "Price Alert", RecurrenceType: "recurring", NotifyViaPush: true, NotifyViaEmail: false}
	mockService.On("CreateAlert", "user-1", mock.MatchedBy(func(input repository.CreateAlertInput) bool {
		return input.FuelTypeID == "u91" && input.PriceThreshold == 189.9 && input.Latitude == -33.86 && input.Longitude == 151.2 &&
			input.RadiusKm == 10 && input.AlertName == "Price Alert" && input.RecurrenceType == "recurring" && input.NotifyViaPush && !input.NotifyViaEmail
	})).Return(alert, nil).Once()

	payload := map[string]any{
		"fuelTypeId":     "u91",
		"priceThreshold": 189.9,
		"latitude":       -33.86,
		"longitude":      151.2,
		"radiusKm":       10,
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/alerts", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerCreateAlertUnauthorized(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/alerts", h.CreateAlert)

	req := httptest.NewRequest(http.MethodPost, "/alerts", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockService.AssertNotCalled(t, "CreateAlert", mock.Anything, mock.Anything)
}

func TestAlertHandlerGetAlertsSuccess(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.GET("/alerts", h.GetAlerts)

	mockService.On("GetAlerts", "user-1").Return([]models.Alert{{ID: "a1"}}, nil).Once()

	req := httptest.NewRequest(http.MethodGet, "/alerts", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerUpdateAlertNotFound(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.PUT("/alerts/:id", h.UpdateAlert)

	recurrence := "one_off"
	active := true
	notify := false
	mockService.On("UpdateAlert", "alert-1", "user-1", mock.MatchedBy(func(input repository.UpdateAlertInput) bool {
		return input.PriceThreshold == 170.5 && input.RadiusKm == 7 && input.AlertName == "Morning" && input.RecurrenceType != nil &&
			*input.RecurrenceType == recurrence && input.IsActive != nil && *input.IsActive == active && input.NotifyViaEmail != nil && !*input.NotifyViaEmail && input.NotifyViaPush != nil && !*input.NotifyViaPush
	})).Return("", sql.ErrNoRows).Once()

	payload := map[string]any{
		"priceThreshold": 170.5,
		"radiusKm":       7,
		"alertName":      "Morning",
		"recurrenceType": recurrence,
		"notifyViaPush":  notify,
		"notifyViaEmail": notify,
		"isActive":       active,
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPut, "/alerts/alert-1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerDeleteAlertNotFound(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.DELETE("/alerts/:id", h.DeleteAlert)

	mockService.On("DeleteAlert", "alert-1", "user-1").Return(false, nil).Once()

	req := httptest.NewRequest(http.MethodDelete, "/alerts/alert-1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerGetMatchingStationsNotFound(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.GET("/alerts/:id/matching-stations", h.GetMatchingStations)

	mockService.On("GetMatchingStations", "alert-1", "user-1").Return(nil, errors.New("wrapped: "+sql.ErrNoRows.Error())).Once()

	req := httptest.NewRequest(http.MethodGet, "/alerts/alert-1/matching-stations", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerGetMatchingStationsWithWrappedNotFound(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.GET("/alerts/:id/matching-stations", h.GetMatchingStations)

	wrapped := errors.New("prefix")
	err := errors.Join(wrapped, sql.ErrNoRows)
	mockService.On("GetMatchingStations", "alert-2", "user-1").Return(nil, err).Once()

	req := httptest.NewRequest(http.MethodGet, "/alerts/alert-2/matching-stations", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerGetPriceContextSuccess(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/alerts/price-context", h.GetPriceContext)

	result := &repository.PriceContextResult{FuelTypeID: "u91", AveragePrice: 188.2, StationCount: 8}
	mockService.On("GetPriceContext", mock.MatchedBy(func(input repository.PriceContextInput) bool {
		return input.FuelTypeID == "u91" && input.Latitude == -33.86 && input.Longitude == 151.2 && input.RadiusKm == 12
	})).Return(result, nil).Once()

	payload := map[string]any{
		"fuelTypeId": "u91",
		"latitude":   -33.86,
		"longitude":  151.2,
		"radius":     12,
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/alerts/price-context", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerGetPriceContextNotFound(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/alerts/price-context", h.GetPriceContext)

	mockService.On("GetPriceContext", mock.Anything).Return(nil, sql.ErrNoRows).Once()

	payload := map[string]any{"fuelTypeId": "u91", "latitude": -33.86, "longitude": 151.2, "radius": 12}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/alerts/price-context", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockService.AssertExpectations(t)
}

func TestAlertHandlerGetMatchingStationsSuccess(t *testing.T) {
	mockService := new(testhelpers.MockAlertService)
	h := NewAlertHandler(mockService)
	r := authedRouter()
	r.GET("/alerts/:id/matching-stations", h.GetMatchingStations)

	now := time.Now()
	stations := []repository.MatchingStationResult{{StationID: "s1", LastUpdated: &now}}
	mockService.On("GetMatchingStations", "alert-3", "user-1").Return(stations, nil).Once()

	req := httptest.NewRequest(http.MethodGet, "/alerts/alert-3/matching-stations", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}
