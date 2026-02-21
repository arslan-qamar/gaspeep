package handler

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
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

func authedStationOwnerRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	})
	return r
}

func TestValidateProfileInput(t *testing.T) {
	assert.Nil(t, validateProfileInput("Acme Fuel", "Jane", "jane@example.com", "+61 400 111 222"))

	errMap := validateProfileInput("", "", "bad-email", "abc!")
	require.NotNil(t, errMap)
	assert.Equal(t, "Business name is required", errMap["businessName"])
	assert.Equal(t, "Please enter a valid email address", errMap["email"])
	assert.Equal(t, "Phone must contain only digits, spaces, +, -, (, )", errMap["phone"])
}

func TestNewStationOwnerHandler(t *testing.T) {
	mockService := new(testhelpers.MockStationOwnerService)
	h := NewStationOwnerHandler(mockService)
	require.NotNil(t, h)
}

func TestStationOwnerHandlerVerifyOwnershipSuccess(t *testing.T) {
	mockService := new(testhelpers.MockStationOwnerService)
	h := NewStationOwnerHandler(mockService)
	r := authedStationOwnerRouter()
	r.POST("/verify", h.VerifyOwnership)

	owner := &models.StationOwner{ID: "owner-1", UserID: "user-1", BusinessName: "Acme Fuel"}
	mockService.On("VerifyOwnership", "user-1", repository.CreateOwnerVerificationInput{
		BusinessName:          "Acme Fuel",
		VerificationDocuments: "doc-url",
		ContactInfo:           "Jane 0400",
	}).Return(owner, nil).Once()

	payload := map[string]any{
		"businessName":          "Acme Fuel",
		"verificationDocuments": "doc-url",
		"contactInfo":           "Jane 0400",
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/verify", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockService.AssertExpectations(t)
}

func TestStationOwnerHandlerProfileAndStationEndpoints(t *testing.T) {
	mockService := new(testhelpers.MockStationOwnerService)
	h := NewStationOwnerHandler(mockService)
	r := authedStationOwnerRouter()
	r.GET("/stations", h.GetStations)
	r.GET("/profile", h.GetProfile)
	r.PATCH("/profile", h.UpdateProfile)
	r.GET("/stats", h.GetStats)
	r.GET("/fuel-prices", h.GetFuelPrices)

	mockService.On("GetStations", "user-1").Return([]map[string]interface{}{{"id": "s1"}}, nil).Once()
	req := httptest.NewRequest(http.MethodGet, "/stations", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("GetProfile", "user-1").Return(map[string]interface{}{"id": "owner-1"}, nil).Once()
	req = httptest.NewRequest(http.MethodGet, "/profile", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("UpdateProfile", "user-1", repository.UpdateOwnerProfileInput{
		BusinessName: "Acme Fuel",
		ContactName:  "Jane",
		ContactEmail: "jane@example.com",
		ContactPhone: "+61400111222",
	}).Return(map[string]interface{}{"businessName": "Acme Fuel"}, nil).Once()
	payload := map[string]any{"businessName": "Acme Fuel", "contactName": "Jane", "email": "jane@example.com", "phone": "+61400111222"}
	body, err := json.Marshal(payload)
	require.NoError(t, err)
	req = httptest.NewRequest(http.MethodPatch, "/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	req = httptest.NewRequest(http.MethodPatch, "/profile", bytes.NewReader([]byte(`{"businessName":"A","email":"bad"}`)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)

	mockService.On("GetStats", "user-1").Return(map[string]interface{}{"totalStations": 1}, nil).Once()
	req = httptest.NewRequest(http.MethodGet, "/stats", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("GetFuelPrices", "user-1").Return(map[string]interface{}{"prices": []interface{}{}}, nil).Once()
	req = httptest.NewRequest(http.MethodGet, "/fuel-prices", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.AssertExpectations(t)
}

func TestStationOwnerHandlerSearchClaimAndStationMutations(t *testing.T) {
	mockService := new(testhelpers.MockStationOwnerService)
	h := NewStationOwnerHandler(mockService)
	r := authedStationOwnerRouter()
	r.GET("/search-stations", h.SearchStations)
	r.POST("/claim-station", h.ClaimStation)
	r.GET("/stations/:id", h.GetStationDetails)
	r.PUT("/stations/:id", h.UpdateStation)
	r.POST("/stations/:id/unclaim", h.UnclaimStation)
	r.POST("/stations/:id/reverify", h.ReVerifyStation)

	stations := []map[string]interface{}{{
		"id":         "s1",
		"name":       "Station One",
		"brand":      "BrandX",
		"address":    "123 Main",
		"latitude":   -33.86,
		"longitude":  151.2,
		"distanceKm": 1.7,
	}}
	mockService.On("SearchAvailableStations", "shell", "-33.86", "151.20", "5").Return(stations, nil).Once()
	req := httptest.NewRequest(http.MethodGet, "/search-stations?query=shell&lat=-33.86&lon=151.20&radius=5", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("ClaimStation", "user-1", "s1", "document", []string{"u1", "u2"}, "0400", "x@y.com").
		Return(map[string]interface{}{"claimId": "c1"}, nil).Once()
	claimPayload := map[string]any{
		"stationId":          "s1",
		"verificationMethod": "document",
		"documentUrls":       []string{"u1", "u2"},
		"phoneNumber":        "0400",
		"email":              "x@y.com",
	}
	body, err := json.Marshal(claimPayload)
	require.NoError(t, err)
	req = httptest.NewRequest(http.MethodPost, "/claim-station", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	mockService.On("GetStationDetails", "user-1", "s1").Return(map[string]interface{}{"id": "s1"}, nil).Once()
	req = httptest.NewRequest(http.MethodGet, "/stations/s1", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("UpdateStation", "user-1", "s1", mock.Anything).Return(map[string]interface{}{"id": "s1", "name": "Updated"}, nil).Once()
	updatePayload := map[string]any{"name": "Updated", "phone": "0400", "website": "https://x.com", "operatingHours": map[string]any{"mon": "9-5"}, "amenities": []string{"carwash"}}
	body, err = json.Marshal(updatePayload)
	require.NoError(t, err)
	req = httptest.NewRequest(http.MethodPut, "/stations/s1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("UnclaimStation", "user-1", "s1").Return(nil).Once()
	req = httptest.NewRequest(http.MethodPost, "/stations/s1/unclaim", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.On("ReVerifyStation", "user-1", "s1").Return(map[string]interface{}{"status": "pending"}, nil).Once()
	req = httptest.NewRequest(http.MethodPost, "/stations/s1/reverify", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	mockService.AssertExpectations(t)
}

func TestStationOwnerHandlerUploadPhotosAndUnauthorized(t *testing.T) {
	mockService := new(testhelpers.MockStationOwnerService)
	h := NewStationOwnerHandler(mockService)
	r := authedStationOwnerRouter()
	r.POST("/stations/:id/photos", h.UploadPhotos)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("photos", "pic1.jpg")
	require.NoError(t, err)
	_, err = part.Write([]byte("fakejpeg"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	mockService.On("SavePhotos", "user-1", "s1", []string{"/uploads/pic1.jpg"}).Return([]string{"/uploads/pic1.jpg"}, nil).Once()
	req := httptest.NewRequest(http.MethodPost, "/stations/s1/photos", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	mockService.AssertExpectations(t)

	gin.SetMode(gin.TestMode)
	unauthRouter := gin.New()
	unauthRouter.GET("/stations", h.GetStations)
	req = httptest.NewRequest(http.MethodGet, "/stations", nil)
	w = httptest.NewRecorder()
	unauthRouter.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
