-- 019_add_alert_recurrence_type.up.sql
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) NOT NULL DEFAULT 'recurring';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'alerts_recurrence_type_check'
  ) THEN
    ALTER TABLE alerts
      ADD CONSTRAINT alerts_recurrence_type_check
      CHECK (recurrence_type IN ('recurring', 'one_off'));
  END IF;
END $$;
