package middleware

import (
	"net/http"
	"os"
	"strings"

	"gaspeep/backend/internal/auth"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read allowlist from env var (comma-separated). If provided, only echo
		// origins that exactly match an entry. If not provided and running in
		// development, echo the request Origin to make local dev easier. In
		// production you should set CORS_ALLOWED_ORIGINS to a comma-separated
		// list of allowed origins.

		origin := c.Request.Header.Get("Origin")
		allowedList := os.Getenv("CORS_ALLOWED_ORIGINS")
		env := os.Getenv("ENV")

		allowedOrigin := ""
		if origin != "" {
			if allowedList != "" {
				for _, o := range strings.Split(allowedList, ",") {
					if strings.TrimSpace(o) == origin {
						allowedOrigin = origin
						break
					}
				}
			} else {
				// No allowlist configured — in development echo origin, in
				// production prefer APP_BASE_URL if present.
				if env == "development" {
					allowedOrigin = origin
				} else {
					allowedOrigin = os.Getenv("APP_BASE_URL")
				}
			}
		}

		if allowedOrigin == "" {
			// As a safe fallback when nothing matches, avoid returning a
			// wildcard together with credentials: browsers will reject it. Use
			// a conservative default (no Access-Control-Allow-Origin) instead.
			// We'll still set Vary for proxies.
			c.Writer.Header().Set("Vary", "Origin")
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			c.Writer.Header().Set("Vary", "Origin")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func ErrorHandlingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			code := http.StatusInternalServerError

			if c.Writer.Status() != http.StatusOK {
				code = c.Writer.Status()
			}

			c.JSON(code, gin.H{
				"error":  err.Error(),
				"status": "error",
			})
		}
	}
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try Authorization header first, then fallback to cookie 'auth_token'
		var tokenString string
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			// Extract token from "Bearer <token>"
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		if tokenString == "" {
			if cookie, err := c.Cookie("auth_token"); err == nil {
				tokenString = cookie
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization token"})
			c.Abort()
			return
		}

		// Validate JWT token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Set user ID in context for downstream handlers
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)

		c.Next()
	}
}
