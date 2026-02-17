-- 011_add_owner_to_stations_table.down.sql
DROP INDEX IF EXISTS idx_stations_verification_status;
DROP INDEX IF EXISTS idx_stations_owner_id;

ALTER TABLE stations
DROP COLUMN IF EXISTS verification_status;

ALTER TABLE stations
DROP COLUMN IF EXISTS owner_id;
