DROP INDEX IF EXISTS idx_price_submissions_source_hash_unique;

ALTER TABLE price_submissions
DROP COLUMN IF EXISTS source_hash;

DELETE FROM fuel_types
WHERE name = 'EV';

DROP TABLE IF EXISTS service_nsw_fuel_type_mappings;
DROP TABLE IF EXISTS service_nsw_sync_state;

DROP INDEX IF EXISTS idx_stations_service_nsw_state_code;

ALTER TABLE stations
DROP COLUMN IF EXISTS service_nsw_state,
DROP COLUMN IF EXISTS service_nsw_station_id,
DROP COLUMN IF EXISTS service_nsw_station_code;
