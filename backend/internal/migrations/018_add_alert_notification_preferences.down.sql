-- 018_add_alert_notification_preferences.down.sql
ALTER TABLE alerts
  DROP COLUMN IF EXISTS notify_via_email,
  DROP COLUMN IF EXISTS notify_via_push;
