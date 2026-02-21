package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	testhelpers "gaspeep/backend/internal/handler/testhelpers"
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestFuelTypeHandler(t *testing.T) {
	mockService := new(testhelpers.MockFuelTypeService)
	h := NewFuelTypeHandler(mockService)
	require.NotNil(t, h)

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/fuel-types", h.GetFuelTypes)
	r.GET("/fuel-types/:id", h.GetFuelType)

	mockService.On("GetFuelTypes").Return([]models.FuelType{{ID: "u91"}}, nil).Once()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/fuel-types", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("GetFuelType", "u91").Return(&models.FuelType{ID: "u91"}, nil).Once()
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/fuel-types/u91", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("GetFuelType", "404").Return(nil, sql.ErrNoRows).Once()
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/fuel-types/404", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	mockService.AssertExpectations(t)
}

func TestFuelPriceHandler(t *testing.T) {
	mockService := new(testhelpers.MockFuelPriceService)
	h := NewFuelPriceHandler(mockService)
	require.NotNil(t, h)

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/fuel-prices", h.GetFuelPrices)
	r.GET("/stations/:id/prices", h.GetStationPrices)
	r.GET("/fuel-prices/cheapest", h.GetCheapestPrices)

	mockService.On("GetFuelPrices", mock.MatchedBy(func(filters repository.FuelPriceFilters) bool {
		return filters.StationID == "s1" && filters.FuelTypeID == "u91" && filters.Lat == -33.86 && filters.Lon == 151.2 && filters.RadiusKm == 5
	})).Return([]repository.FuelPriceResult{{ID: "p1"}}, nil).Once()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/fuel-prices?stationId=s1&fuelTypeId=u91&lat=-33.86&lon=151.2&radius=5", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("GetStationPrices", "s1").Return(nil, errors.New("db fail")).Once()
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/stations/s1/prices", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/fuel-prices/cheapest?lat=-33.86&lon=151.2", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	mockService.On("GetCheapestPrices", -33.86, 151.2, 8.0).Return([]repository.CheapestPriceResult{{ID: "p2"}}, nil).Once()
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/fuel-prices/cheapest?lat=-33.86&lon=151.2&radius=8", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.AssertExpectations(t)
}

func TestNotificationHandler(t *testing.T) {
	mockService := new(testhelpers.MockNotificationService)
	h := NewNotificationHandler(mockService)
	require.NotNil(t, h)

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/notifications", h.GetNotifications)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/notifications", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	authed := gin.New()
	authed.Use(func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	})
	authed.GET("/notifications", h.GetNotifications)

	mockService.On("GetNotifications", "user-1").Return([]models.Notification{{ID: "n1"}}, nil).Once()
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/notifications", nil)
	authed.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("GetNotifications", "user-1").Return(nil, errors.New("fetch fail")).Once()
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/notifications", nil)
	authed.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	mockService.AssertExpectations(t)
}
