package handler

import (
	"net/http"

	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

// NotificationHandler handles notification endpoints
type NotificationHandler struct {
	notificationService service.NotificationService
}

func NewNotificationHandler(notificationService service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

// GetNotifications handles GET /api/notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	notifications, err := h.notificationService.GetNotifications(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifications)
}
