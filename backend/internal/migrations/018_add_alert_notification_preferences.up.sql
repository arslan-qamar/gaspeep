-- 018_add_alert_notification_preferences.up.sql
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS notify_via_push BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_via_email BOOLEAN NOT NULL DEFAULT false;
