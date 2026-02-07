package handler

import (
	"database/sql"
	"net/http"
	"time"

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

	// Simulate password reset (in production, send email)
	c.JSON(http.StatusOK, gin.H{"message": "Password reset link sent to " + req.Email})
}
