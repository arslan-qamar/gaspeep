package handler

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

type testSubmissionService struct{}

func (s *testSubmissionService) CreateSubmission(string, service.CreateSubmissionRequest) (*repository.PriceSubmissionResult, error) {
	return nil, nil
}

func (s *testSubmissionService) GetMySubmissions(string, int, int) ([]repository.PriceSubmissionWithDetails, int, error) {
	return nil, 0, nil
}

func (s *testSubmissionService) GetModerationQueue(string, int, int) ([]repository.PriceSubmissionWithDetails, int, error) {
	return nil, 0, nil
}

func (s *testSubmissionService) ModerateSubmission(string, string, string) (bool, error) {
	return false, nil
}

type testOCRService struct {
	result *service.OCRResult
	err    error
}

func (s *testOCRService) AnalyzeFuelPrices(context.Context, []byte, string) (*service.OCRResult, error) {
	return s.result, s.err
}

func makeMultipartImageRequest(t *testing.T, fieldName string, content []byte) (*http.Request, *httptest.ResponseRecorder) {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile(fieldName, "price.jpg")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatalf("failed to write image content: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("failed to close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/price-submissions/analyze-photo", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rr := httptest.NewRecorder()
	return req, rr
}

func TestPriceSubmissionHandler_AnalyzePhoto_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := NewPriceSubmissionHandler(&testSubmissionService{})
	handler.SetOCRService(&testOCRService{
		result: &service.OCRResult{
			Entries: []service.OCRPriceEntry{
				{FuelType: "E10", Price: 3.95},
				{FuelType: "Diesel", Price: 4.19},
			},
			OCRData: "E10 3.95\nDiesel 4.19",
		},
	})

	router.POST("/api/price-submissions/analyze-photo", func(c *gin.Context) {
		c.Set("userID", "user-1")
		handler.AnalyzePhoto(c)
	})

	req, rr := makeMultipartImageRequest(t, "photo", []byte("fake image bytes"))
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"fuelType":"E10"`)
	assert.Contains(t, rr.Body.String(), `"fuelType":"Diesel"`)
	assert.Contains(t, rr.Body.String(), `"ocrData":"E10 3.95\nDiesel 4.19"`)
}

func TestPriceSubmissionHandler_AnalyzePhoto_NoFile(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := NewPriceSubmissionHandler(&testSubmissionService{})
	handler.SetOCRService(&testOCRService{})

	router.POST("/api/price-submissions/analyze-photo", func(c *gin.Context) {
		c.Set("userID", "user-1")
		handler.AnalyzePhoto(c)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/price-submissions/analyze-photo", bytes.NewReader(nil))
	req.Header.Set("Content-Type", "multipart/form-data")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)
	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "photo file is required")
}

func TestPriceSubmissionHandler_AnalyzePhoto_NoTextDetected(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := NewPriceSubmissionHandler(&testSubmissionService{})
	handler.SetOCRService(&testOCRService{err: service.ErrOCRNoTextDetected})

	router.POST("/api/price-submissions/analyze-photo", func(c *gin.Context) {
		c.Set("userID", "user-1")
		handler.AnalyzePhoto(c)
	})

	req, rr := makeMultipartImageRequest(t, "photo", []byte("fake image bytes"))
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusUnprocessableEntity, rr.Code)
	assert.Contains(t, rr.Body.String(), "could not detect readable fuel prices")
}

func TestPriceSubmissionHandler_AnalyzePhoto_OCRUnavailable(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := NewPriceSubmissionHandler(&testSubmissionService{})
	handler.SetOCRService(&testOCRService{err: service.ErrOCRUnavailable})

	router.POST("/api/price-submissions/analyze-photo", func(c *gin.Context) {
		c.Set("userID", "user-1")
		handler.AnalyzePhoto(c)
	})

	req, rr := makeMultipartImageRequest(t, "photo", []byte("fake image bytes"))
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusServiceUnavailable, rr.Code)
	assert.Contains(t, rr.Body.String(), "temporarily unavailable")
}
