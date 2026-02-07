package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// NotificationHandler handles notification endpoints
type NotificationHandler struct {
	db *sql.DB
}

func NewNotificationHandler(db *sql.DB) *NotificationHandler {
	return &NotificationHandler{db: db}
}

// GetNotifications handles GET /api/notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	query := `
		SELECT id, notification_type, title, message, sent_at, is_read, delivery_status, action_url, alert_id, broadcast_id
		FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 100`

	rows, err := h.db.Query(query, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
		return
	}
	defer rows.Close()

	notifications := []map[string]interface{}{}
	for rows.Next() {
		var (
			id, notificationType, title, message, deliveryStatus, actionURL string
			sentAt time.Time
			isRead bool
			alertID, broadcastID sql.NullString
		)

		if err := rows.Scan(&id, &notificationType, &title, &message, &sentAt, &isRead, &deliveryStatus, &actionURL, &alertID, &broadcastID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan notification"})
			return
		}

		n := map[string]interface{}{
			"id":               id,
			"notificationType": notificationType,
			"title":            title,
			"message":          message,
			"sentAt":           sentAt,
			"isRead":           isRead,
			"deliveryStatus":   deliveryStatus,
			"actionUrl":        actionURL,
		}
		if alertID.Valid {
			n["alertId"] = alertID.String
		}
		if broadcastID.Valid {
			n["broadcastId"] = broadcastID.String
		}
		notifications = append(notifications, n)
	}

	c.JSON(http.StatusOK, notifications)
}
