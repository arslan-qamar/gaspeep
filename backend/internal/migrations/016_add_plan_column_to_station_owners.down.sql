-- 016_add_plan_column_to_station_owners.down.sql
ALTER TABLE station_owners
  DROP COLUMN IF EXISTS plan;
