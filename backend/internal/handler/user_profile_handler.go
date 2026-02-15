package handler

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// UserProfileHandler handles user profile endpoints
type UserProfileHandler struct {
	db *sql.DB
}

func NewUserProfileHandler(db *sql.DB) *UserProfileHandler {
	return &UserProfileHandler{db: db}
}

// GetProfile handles GET /api/users/profile
func (h *UserProfileHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	query := `SELECT id, email, display_name, tier, created_at, updated_at FROM users WHERE id = $1`
	var (
		id, email, displayName, tier string
		createdAt, updatedAt         time.Time
	)

	err := h.db.QueryRow(query, userID.(string)).Scan(&id, &email, &displayName, &tier, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          id,
		"email":       email,
		"displayName": displayName,
		"tier":        tier,
		"createdAt":   createdAt,
		"updatedAt":   updatedAt,
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

	query := `UPDATE users SET display_name = COALESCE($1, display_name), tier = COALESCE($2, tier), updated_at = NOW() WHERE id = $3 RETURNING id`
	var updatedID string
	err := h.db.QueryRow(query, req.DisplayName, req.Tier, userID.(string)).Scan(&updatedID)
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

// PasswordReset handles POST /api/auth/password-reset
func (h *UserProfileHandler) PasswordReset(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check whether a user exists with this email. We always return 200
	// to avoid leaking which emails are registered.
	var userID string
	err := h.db.QueryRow(`SELECT id FROM users WHERE email = $1`, req.Email).Scan(&userID)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process request"})
		return
	}

	// Generate a secure token regardless of whether the user exists.
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate reset token"})
		return
	}
	token := hex.EncodeToString(b)
	expiresAt := time.Now().Add(1 * time.Hour).UTC()

	// If user exists, persist the token using the repository and attempt to send email.
	if userID != "" {
		repo := repository.NewPasswordResetRepository(h.db)
		if err := repo.Create(userID, token, expiresAt); err != nil {
			log.Printf("warning: failed to persist password reset token: %v", err)
		}

		// Build full reset URL if APP_BASE_URL is set, otherwise use relative path.
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
