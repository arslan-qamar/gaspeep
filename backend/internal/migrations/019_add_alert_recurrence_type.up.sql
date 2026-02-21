-- 019_add_alert_recurrence_type.up.sql
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) NOT NULL DEFAULT 'recurring';

ALTER TABLE alerts
  DROP CONSTRAINT IF EXISTS alerts_recurrence_type_check;

ALTER TABLE alerts
  ADD CONSTRAINT alerts_recurrence_type_check
  CHECK (recurrence_type IN ('recurring', 'one_off'));
