-- 019_add_alert_recurrence_type.down.sql
ALTER TABLE alerts
  DROP CONSTRAINT IF EXISTS alerts_recurrence_type_check;

ALTER TABLE alerts
  DROP COLUMN IF EXISTS recurrence_type;
