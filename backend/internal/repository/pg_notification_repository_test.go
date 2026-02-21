package repository

import (
	"testing"
	"time"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPgNotificationRepository_GetByUserID(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)

	user := testhelpers.CreateTestUser(t, db)
	otherUser := testhelpers.CreateTestUser(t, db)
	fuelTypeID := testhelpers.CreateTestFuelType(t, db, "RepoNotifE10")
	alert := testhelpers.CreateTestAlert(t, db, user.ID, -33.8568, 151.2153)

	_, err := db.Exec(`
		INSERT INTO notifications (id, user_id, notification_type, title, message, sent_at, is_read, delivery_status, action_url, alert_id, broadcast_id)
		VALUES
			($1, $2, 'price_alert', 'New Low Price', 'Price dropped near you', $3, false, 'sent', '/alerts/1', $4, $5),
			($6, $2, 'broadcast', 'Owner Message', 'Station update', $7, true, 'sent', '/broadcasts/1', NULL, NULL),
			($8, $9, 'price_alert', 'Other User', 'Ignore this', $7, false, 'sent', '/alerts/other', NULL, NULL)
	`,
		uuid.NewString(), user.ID, time.Now().Add(-1*time.Hour), alert.ID, uuid.NewString(),
		uuid.NewString(), time.Now(),
		uuid.NewString(), otherUser.ID,
	)
	require.NoError(t, err)

	// Ensure joined/nullable fields behave correctly and only user-specific rows are returned.
	repo := NewPgNotificationRepository(db)
	results, err := repo.GetByUserID(user.ID)

	require.NoError(t, err)
	require.Len(t, results, 2)
	assert.Equal(t, user.ID, results[0].UserID)
	assert.Equal(t, "Owner Message", results[0].Title)
	assert.Equal(t, "New Low Price", results[1].Title)
	assert.Equal(t, "sent", results[0].DeliveryStatus)
	assert.Equal(t, "/broadcasts/1", results[0].ActionURL)
	assert.Equal(t, "/alerts/1", results[1].ActionURL)
	assert.NotNil(t, results[1].AlertID)
	assert.Equal(t, alert.ID, *results[1].AlertID)
	assert.NotNil(t, results[1].BroadcastID)

	// Keep fuel type inserted and used to avoid migration defaults conflicts in shared DB runs.
	assert.NotEmpty(t, fuelTypeID)
}

func TestPgNotificationRepository_GetByUserID_QueryError(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgNotificationRepository(db)

	_, err := repo.GetByUserID("not-a-uuid")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to query notifications")
}
