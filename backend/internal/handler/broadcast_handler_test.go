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

func authedBroadcastRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	})
	return r
}

func TestNewBroadcastHandler(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	require.NotNil(t, h)
}

func TestBroadcastHandlerCreateBroadcastSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.POST("/broadcasts", h.CreateBroadcast)

	start := time.Now().Add(time.Hour).UTC().Truncate(time.Second)
	end := start.Add(6 * time.Hour)
	broadcast := &models.Broadcast{ID: "b1", StationID: "s1", Title: "Promo"}

	mockService.On("CreateBroadcast", "user-1", mock.MatchedBy(func(input repository.CreateBroadcastInput) bool {
		return input.StationID == "s1" && input.Title == "Promo" && input.Message == "Sale" && input.TargetRadiusKm == 10 && input.StartDate.Equal(start) && input.EndDate.Equal(end) && input.TargetFuelTypes == "u91,diesel"
	})).Return(broadcast, nil).Once()

	payload := map[string]any{
		"stationId":       "s1",
		"title":           "Promo",
		"message":         "Sale",
		"targetRadiusKm":  10,
		"startDate":       start.Format(time.RFC3339),
		"endDate":         end.Format(time.RFC3339),
		"targetFuelTypes": "u91,diesel",
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/broadcasts", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerGetBroadcastsSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.GET("/broadcasts", h.GetBroadcasts)

	mockService.On("GetBroadcasts", "user-1").Return([]models.Broadcast{{ID: "b1"}}, nil).Once()

	req := httptest.NewRequest(http.MethodGet, "/broadcasts", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerUpdateBroadcastNotFound(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.PUT("/broadcasts/:id", h.UpdateBroadcast)

	mockService.On("UpdateBroadcast", "b1", "user-1", mock.Anything).Return("", sql.ErrNoRows).Once()

	payload := map[string]any{"title": "Updated"}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPut, "/broadcasts/b1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerGetBroadcastSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.GET("/broadcasts/:id", h.GetBroadcast)

	mockService.On("GetBroadcast", "b1", "user-1").Return(&models.Broadcast{ID: "b1"}, nil).Once()

	req := httptest.NewRequest(http.MethodGet, "/broadcasts/b1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerGetBroadcastEngagementSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.GET("/broadcasts/:id/engagement", h.GetBroadcastEngagement)

	mockService.On("GetEngagement", "b1", "user-1").Return([]map[string]interface{}{{"views": 100}}, nil).Once()

	req := httptest.NewRequest(http.MethodGet, "/broadcasts/b1/engagement", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerSaveDraftBadRequest(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.POST("/broadcasts/draft", h.SaveDraft)

	req := httptest.NewRequest(http.MethodPost, "/broadcasts/draft", bytes.NewReader([]byte(`{"title":"missing fields"}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockService.AssertNotCalled(t, "SaveDraft", mock.Anything, mock.Anything)
}

func TestBroadcastHandlerSendBroadcastSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.POST("/broadcasts/:id/send", h.SendBroadcast)

	mockService.On("SendBroadcast", "b1", "user-1").Return(&models.Broadcast{ID: "b1", BroadcastStatus: "sent"}, nil).Once()

	req := httptest.NewRequest(http.MethodPost, "/broadcasts/b1/send", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerScheduleBroadcastBadRequest(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.POST("/broadcasts/:id/schedule", h.ScheduleBroadcast)

	req := httptest.NewRequest(http.MethodPost, "/broadcasts/b1/schedule", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockService.AssertNotCalled(t, "ScheduleBroadcast", mock.Anything, mock.Anything, mock.Anything)
}

func TestBroadcastHandlerCancelBroadcastSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.POST("/broadcasts/:id/cancel", h.CancelBroadcast)

	mockService.On("CancelBroadcast", "b1", "user-1").Return(nil).Once()

	req := httptest.NewRequest(http.MethodPost, "/broadcasts/b1/cancel", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerDeleteBroadcastSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.DELETE("/broadcasts/:id", h.DeleteBroadcast)

	mockService.On("DeleteBroadcast", "b1", "user-1").Return(nil).Once()

	req := httptest.NewRequest(http.MethodDelete, "/broadcasts/b1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerDuplicateBroadcastSuccess(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	r := authedBroadcastRouter()
	r.POST("/broadcasts/:id/duplicate", h.DuplicateBroadcast)

	mockService.On("DuplicateBroadcast", "b1", "user-1").Return(&models.Broadcast{ID: "b2"}, nil).Once()

	req := httptest.NewRequest(http.MethodPost, "/broadcasts/b1/duplicate", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerEstimateRecipients(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/broadcasts/estimate-recipients", h.EstimateRecipients)

	req := httptest.NewRequest(http.MethodGet, "/broadcasts/estimate-recipients", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	mockService.On("EstimateRecipients", "s1", "12").Return(42, nil).Once()
	req = httptest.NewRequest(http.MethodGet, "/broadcasts/estimate-recipients?stationId=s1&radiusKm=12", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)
}

func TestBroadcastHandlerUnauthorizedAndInternalErrorPaths(t *testing.T) {
	mockService := new(testhelpers.MockBroadcastService)
	h := NewBroadcastHandler(mockService)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/broadcasts/:id/send", h.SendBroadcast)

	req := httptest.NewRequest(http.MethodPost, "/broadcasts/b1/send", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	authed := authedBroadcastRouter()
	authed.POST("/broadcasts/:id/send", h.SendBroadcast)
	mockService.On("SendBroadcast", "b2", "user-1").Return(nil, errors.New("boom")).Once()
	req = httptest.NewRequest(http.MethodPost, "/broadcasts/b2/send", nil)
	w = httptest.NewRecorder()
	authed.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	mockService.AssertExpectations(t)
}
