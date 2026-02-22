package handler

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// UserProfileHandler handles user profile endpoints
type UserProfileHandler struct {
	userRepo repository.UserRepository
	prRepo   repository.PasswordResetRepository
}

func NewUserProfileHandler(userRepo repository.UserRepository, prRepo repository.PasswordResetRepository) *UserProfileHandler {
	return &UserProfileHandler{
		userRepo: userRepo,
		prRepo:   prRepo,
	}
}

func isUserNotFoundError(err error) bool {
	return errors.Is(err, sql.ErrNoRows) || strings.Contains(strings.ToLower(err.Error()), "not found")
}

// GetProfile handles GET /api/users/profile
func (h *UserProfileHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	user, err := h.userRepo.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"displayName": user.DisplayName,
		"tier":        user.Tier,
		"createdAt":   user.CreatedAt,
		"updatedAt":   user.UpdatedAt,
	})
}

// UpdateProfile handles PUT /api/users/profile
func (h *UserProfileHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		DisplayName string `json:"displayName"`
		Tier        string `json:"tier"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedID, err := h.userRepo.UpdateProfile(userID.(string), req.DisplayName, req.Tier)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": updatedID, "message": "profile updated"})
}

// GetMapFilterPreferences handles GET /api/users/preferences/map-filters
func (h *UserProfileHandler) GetMapFilterPreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	prefs, err := h.userRepo.GetMapFilterPreferences(userID.(string))
	if err != nil {
		if isUserNotFoundError(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get map filter preferences"})
		return
	}

	if prefs == nil {
		c.JSON(http.StatusOK, models.MapFilterPreferences{
			FuelTypes:    []string{},
			Brands:       []string{},
			MaxPrice:     400,
			OnlyVerified: false,
		})
		return
	}

	c.JSON(http.StatusOK, prefs)
}

// UpdateMapFilterPreferences handles PUT /api/users/preferences/map-filters
func (h *UserProfileHandler) UpdateMapFilterPreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req models.MapFilterPreferences
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.MaxPrice < 0 || req.MaxPrice > 400 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "maxPrice must be between 0 and 400"})
		return
	}
	if req.FuelTypes == nil {
		req.FuelTypes = []string{}
	}
	if req.Brands == nil {
		req.Brands = []string{}
	}

	if err := h.userRepo.UpdateMapFilterPreferences(userID.(string), req); err != nil {
		if isUserNotFoundError(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update map filter preferences"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "map filter preferences updated"})
}

// PasswordReset handles POST /api/auth/password-reset
func (h *UserProfileHandler) PasswordReset(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := h.userRepo.GetUserIDByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process request"})
		return
	}

	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate reset token"})
		return
	}
	token := hex.EncodeToString(b)
	expiresAt := time.Now().Add(1 * time.Hour).UTC()

	if userID != "" {
		if err := h.prRepo.Create(userID, token, expiresAt); err != nil {
			log.Printf("warning: failed to persist password reset token: %v", err)
		}

		resetPath := "/auth/reset-password?token=" + token
		base := os.Getenv("APP_BASE_URL")
		var fullURL string
		if base != "" {
			fullURL = strings.TrimRight(base, "/") + resetPath
		} else {
			fullURL = resetPath
		}

		if err := service.SendPasswordReset(req.Email, fullURL); err != nil {
			log.Printf("warning: failed to send password reset email to %s: %v", req.Email, err)
		} else {
			var masked string
			if len(token) > 8 {
				masked = token[:8] + "..."
			} else {
				masked = "<masked>"
			}
			log.Printf("password reset requested for %s; token=%s (expires %s)", req.Email, masked, expiresAt.Format(time.RFC3339))
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "If an account with that email exists, a password reset link has been sent."})
}
