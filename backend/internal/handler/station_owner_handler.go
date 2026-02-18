package handler

import (
	"net/http"
	"regexp"
	"strings"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	phoneRegex = regexp.MustCompile(`^[\d\s\+\-\(\)]+$`)
)

// validateProfileInput validates the request fields for UpdateProfile.
// Returns a map of field name → error message, or nil if valid.
func validateProfileInput(businessName, contactName, email, phone string) map[string]string {
	errors := make(map[string]string)

	// businessName: required, 2–255 chars
	trimmedBusiness := strings.TrimSpace(businessName)
	if trimmedBusiness == "" {
		errors["businessName"] = "Business name is required"
	} else if len(trimmedBusiness) < 2 {
		errors["businessName"] = "Business name must be at least 2 characters"
	} else if len(trimmedBusiness) > 255 {
		errors["businessName"] = "Business name must be 255 characters or fewer"
	}

	// contactName: optional, max 255 chars
	if len(strings.TrimSpace(contactName)) > 255 {
		errors["contactName"] = "Contact name must be 255 characters or fewer"
	}

	// email: optional, but if present must be valid format
	if trimmedEmail := strings.TrimSpace(email); trimmedEmail != "" {
		if len(trimmedEmail) > 255 {
			errors["email"] = "Email must be 255 characters or fewer"
		} else if !emailRegex.MatchString(trimmedEmail) {
			errors["email"] = "Please enter a valid email address"
		}
	}

	// phone: optional, but if present must match allowed characters
	if trimmedPhone := strings.TrimSpace(phone); trimmedPhone != "" {
		if len(trimmedPhone) > 50 {
			errors["phone"] = "Phone must be 50 characters or fewer"
		} else if !phoneRegex.MatchString(trimmedPhone) {
			errors["phone"] = "Phone must contain only digits, spaces, +, -, (, )"
		}
	}

	if len(errors) == 0 {
		return nil
	}
	return errors
}

// StationOwnerHandler handles station owner endpoints
type StationOwnerHandler struct {
	stationOwnerService service.StationOwnerService
}

func NewStationOwnerHandler(stationOwnerService service.StationOwnerService) *StationOwnerHandler {
	return &StationOwnerHandler{stationOwnerService: stationOwnerService}
}

// VerifyOwnership handles POST /api/station-owners/verify
func (h *StationOwnerHandler) VerifyOwnership(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		BusinessName          string `json:"businessName" binding:"required"`
		VerificationDocuments string `json:"verificationDocuments" binding:"required"`
		ContactInfo           string `json:"contactInfo" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	owner, err := h.stationOwnerService.VerifyOwnership(userID.(string), repository.CreateOwnerVerificationInput{
		BusinessName:          req.BusinessName,
		VerificationDocuments: req.VerificationDocuments,
		ContactInfo:           req.ContactInfo,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify ownership"})
		return
	}

	c.JSON(http.StatusCreated, owner)
}

// GetStations handles GET /api/station-owners/stations
func (h *StationOwnerHandler) GetStations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stations, err := h.stationOwnerService.GetStations(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stations"})
		return
	}

	c.JSON(http.StatusOK, stations)
}

// GetProfile handles GET /api/station-owners/profile
func (h *StationOwnerHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	profile, err := h.stationOwnerService.GetProfile(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile handles PATCH /api/station-owners/profile
func (h *StationOwnerHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		BusinessName string `json:"businessName"`
		ContactName  string `json:"contactName"`
		Email        string `json:"email"`
		Phone        string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if validationErrors := validateProfileInput(req.BusinessName, req.ContactName, req.Email, req.Phone); validationErrors != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"errors": validationErrors})
		return
	}

	profile, err := h.stationOwnerService.UpdateProfile(userID.(string), repository.UpdateOwnerProfileInput{
		BusinessName: req.BusinessName,
		ContactName:  req.ContactName,
		ContactEmail: req.Email,
		ContactPhone: req.Phone,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// GetStats handles GET /api/station-owners/stats
func (h *StationOwnerHandler) GetStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stats, err := h.stationOwnerService.GetStats(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetFuelPrices handles GET /api/station-owners/fuel-prices
func (h *StationOwnerHandler) GetFuelPrices(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	prices, err := h.stationOwnerService.GetFuelPrices(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch fuel prices"})
		return
	}

	c.JSON(http.StatusOK, prices)
}

// SearchStations handles GET /api/station-owners/search-stations
func (h *StationOwnerHandler) SearchStations(c *gin.Context) {
	query := c.Query("query")
	lat := c.Query("lat")
	lon := c.Query("lon")
	radius := c.Query("radius")

	stations, err := h.stationOwnerService.SearchAvailableStations(query, lat, lon, radius)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search stations"})
		return
	}

	// Transform repository response to match frontend expectations
	type availableStationResponse struct {
		ID        string  `json:"id"`
		Name      string  `json:"name"`
		Brand     string  `json:"brand"`
		Address   string  `json:"address"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Distance  float64 `json:"distance"`
		ClaimStatus string `json:"claimStatus"`
	}

	var response []availableStationResponse
	for _, station := range stations {
		response = append(response, availableStationResponse{
			ID:        station["id"].(string),
			Name:      station["name"].(string),
			Brand:     station["brand"].(string),
			Address:   station["address"].(string),
			Latitude:  station["latitude"].(float64),
			Longitude: station["longitude"].(float64),
			Distance:  station["distanceKm"].(float64),
			ClaimStatus: "available",
		})
	}

	c.JSON(http.StatusOK, response)
}

// ClaimStation handles POST /api/station-owners/claim-station
func (h *StationOwnerHandler) ClaimStation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		StationID           string   `json:"stationId" binding:"required"`
		VerificationMethod  string   `json:"verificationMethod" binding:"required"`
		DocumentUrls        []string `json:"documentUrls"`
		PhoneNumber         string   `json:"phoneNumber"`
		Email               string   `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.stationOwnerService.ClaimStation(
		userID.(string),
		req.StationID,
		req.VerificationMethod,
		req.DocumentUrls,
		req.PhoneNumber,
		req.Email,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to claim station"})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// GetStationDetails handles GET /api/station-owners/stations/:id
func (h *StationOwnerHandler) GetStationDetails(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stationID := c.Param("id")
	station, err := h.stationOwnerService.GetStationDetails(userID.(string), stationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch station details"})
		return
	}

	c.JSON(http.StatusOK, station)
}

// UpdateStation handles PUT /api/station-owners/stations/:id
func (h *StationOwnerHandler) UpdateStation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stationID := c.Param("id")

	var req struct {
		Name            string      `json:"name"`
		Phone           string      `json:"phone"`
		Website         string      `json:"website"`
		OperatingHours  interface{} `json:"operatingHours"`
		Amenities       []string    `json:"amenities"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	station, err := h.stationOwnerService.UpdateStation(userID.(string), stationID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update station"})
		return
	}

	c.JSON(http.StatusOK, station)
}

// UploadPhotos handles POST /api/station-owners/stations/:id/photos
func (h *StationOwnerHandler) UploadPhotos(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stationID := c.Param("id")

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse form"})
		return
	}

	files := c.Request.MultipartForm.File["photos"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no photos provided"})
		return
	}

	// Store files and get URLs
	var photoURLs []string
	for _, file := range files {
		// TODO: Implement file storage (S3, local, etc.)
		// For now, just store the filename
		photoURLs = append(photoURLs, "/uploads/"+file.Filename)
	}

	result, err := h.stationOwnerService.SavePhotos(userID.(string), stationID, photoURLs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save photos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"photos": result})
}

// UnclaimStation handles POST /api/station-owners/stations/:id/unclaim
func (h *StationOwnerHandler) UnclaimStation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stationID := c.Param("id")

	if err := h.stationOwnerService.UnclaimStation(userID.(string), stationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unclaim station"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "station unclaimed"})
}

// ReVerifyStation handles POST /api/station-owners/stations/:id/reverify
func (h *StationOwnerHandler) ReVerifyStation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	stationID := c.Param("id")

	result, err := h.stationOwnerService.ReVerifyStation(userID.(string), stationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reverify station"})
		return
	}

	c.JSON(http.StatusOK, result)
}
