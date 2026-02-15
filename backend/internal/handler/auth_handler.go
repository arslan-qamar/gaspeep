package handler

import (
	"net/http"
	"os"
	"time"

	"gaspeep/backend/internal/auth"
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo repository.UserRepository
	prRepo   repository.PasswordResetRepository
}

func NewAuthHandler(userRepo repository.UserRepository, prRepo repository.PasswordResetRepository) *AuthHandler {
	return &AuthHandler{
		userRepo: userRepo,
		prRepo:   prRepo,
	}
}

type SignUpRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	DisplayName string `json:"displayName" binding:"required"`
	Tier        string `json:"tier" binding:"required"`
}

type SignUpResponse struct {
	Available bool `json:"available"`
}

type SignInRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (h *AuthHandler) SignUp(c *gin.Context) {
	var req SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingUser, _ := h.userRepo.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user, err := h.userRepo.CreateUser(req.Email, string(hashedPassword), req.DisplayName, req.Tier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user error is " + err.Error()})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Set cookie (HttpOnly) for session
	cookieDomain := os.Getenv("AUTH_COOKIE_DOMAIN")

	secureFlag := false
	if os.Getenv("AUTH_COOKIE_SECURE") == "true" {
		secureFlag = true
	} else if os.Getenv("ENV") == "production" {
		secureFlag = true
	} else if c.Request.TLS != nil {
		secureFlag = true
	}

	sameSite := http.SameSiteNoneMode
	if os.Getenv("ENV") == "production" {
		sameSite = http.SameSiteLaxMode
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   secureFlag,
		SameSite: sameSite,
		MaxAge:   60 * 60 * 24 * 7,
	})

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) SignIn(c *gin.Context) {
	var req SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	passwordHash, err := h.userRepo.GetPasswordHash(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Set HttpOnly cookie
	cookieDomain := os.Getenv("AUTH_COOKIE_DOMAIN")
	secureFlag := false
	if os.Getenv("AUTH_COOKIE_SECURE") == "true" {
		secureFlag = true
	}
	if c.Request.TLS != nil {
		secureFlag = true
	}
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   secureFlag,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   60 * 60 * 24 * 7,
	})

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

// Logout clears the auth cookie
func (h *AuthHandler) Logout(c *gin.Context) {
	cookieDomain := os.Getenv("AUTH_COOKIE_DOMAIN")

	secureFlag := false
	if os.Getenv("AUTH_COOKIE_SECURE") == "true" {
		secureFlag = true
	} else if os.Getenv("ENV") == "production" {
		secureFlag = true
	}

	sameSite := http.SameSiteNoneMode
	if os.Getenv("ENV") == "production" {
		sameSite = http.SameSiteLaxMode
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   secureFlag,
		SameSite: sameSite,
		MaxAge:   -1,
	})
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	user, err := h.userRepo.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) CheckEmailAvailability(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}

	existingUser, _ := h.userRepo.GetUserByEmail(email)
	available := existingUser == nil

	c.JSON(http.StatusOK, SignUpResponse{
		Available: available,
	})
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, expiresAt, err := h.prRepo.FindByToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}

	if time.Now().After(expiresAt) {
		_ = h.prRepo.DeleteByToken(req.Token)
		c.JSON(http.StatusBadRequest, gin.H{"error": "token expired"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	if err := h.userRepo.UpdatePassword(userID, string(hashed)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	_ = h.prRepo.DeleteByToken(req.Token)

	c.JSON(http.StatusOK, gin.H{"message": "password has been reset"})
}
