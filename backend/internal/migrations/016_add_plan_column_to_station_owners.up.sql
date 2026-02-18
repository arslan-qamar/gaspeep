-- 016_add_plan_column_to_station_owners.up.sql
-- Add plan column to station_owners table for subscription tier tracking
-- Values: 'basic' (default), 'premium', 'enterprise'

ALTER TABLE station_owners
  ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NOT NULL DEFAULT 'basic';
