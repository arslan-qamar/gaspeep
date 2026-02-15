package repository

import (
	"database/sql"
	"fmt"

	"gaspeep/backend/internal/models"
)

// PgNotificationRepository is the PostgreSQL implementation of NotificationRepository.
type PgNotificationRepository struct {
	db *sql.DB
}

func NewPgNotificationRepository(db *sql.DB) *PgNotificationRepository {
	return &PgNotificationRepository{db: db}
}

func (r *PgNotificationRepository) GetByUserID(userID string) ([]models.Notification, error) {
	query := `
		SELECT id, notification_type, title, message, sent_at, is_read, delivery_status, action_url, alert_id, broadcast_id
		FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 100`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		n.UserID = userID
		if err := rows.Scan(&n.ID, &n.NotificationType, &n.Title, &n.Message, &n.SentAt, &n.IsRead, &n.DeliveryStatus, &n.ActionURL, &n.AlertID, &n.BroadcastID); err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		notifications = append(notifications, n)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating notification rows: %w", err)
	}

	return notifications, nil
}

var _ NotificationRepository = (*PgNotificationRepository)(nil)
