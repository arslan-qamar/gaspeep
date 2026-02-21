ALTER TABLE stations
ADD COLUMN IF NOT EXISTS service_nsw_station_code VARCHAR(64),
ADD COLUMN IF NOT EXISTS service_nsw_station_id VARCHAR(128),
ADD COLUMN IF NOT EXISTS service_nsw_state VARCHAR(8);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stations_service_nsw_state_code
ON stations(service_nsw_state, service_nsw_station_code)
WHERE service_nsw_station_code IS NOT NULL AND service_nsw_station_code <> '';

CREATE TABLE IF NOT EXISTS service_nsw_sync_state (
  sync_key VARCHAR(64) PRIMARY KEY,
  last_success_at TIMESTAMP,
  last_full_sync_at TIMESTAMP,
  last_incremental_sync_at TIMESTAMP,
  last_reference_sync_at TIMESTAMP,
  last_error TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_nsw_fuel_type_mappings (
  external_code VARCHAR(32) PRIMARY KEY,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO fuel_types (id, name, display_name, description, color_code, display_order)
VALUES ('550e8400-e29b-41d4-a716-446655440012'::uuid, 'EV', 'EV Charge', 'Electric vehicle charging', '#22D3EE', 12)
ON CONFLICT (name) DO NOTHING;

INSERT INTO service_nsw_fuel_type_mappings (external_code, fuel_type_id) VALUES
  ('E10', '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('U91', '550e8400-e29b-41d4-a716-446655440002'::uuid),
  ('DL', '550e8400-e29b-41d4-a716-446655440003'::uuid),
  ('PDL', '550e8400-e29b-41d4-a716-446655440004'::uuid),
  ('P95', '550e8400-e29b-41d4-a716-446655440005'::uuid),
  ('P98', '550e8400-e29b-41d4-a716-446655440006'::uuid),
  ('LPG', '550e8400-e29b-41d4-a716-446655440007'::uuid),
  ('ADBLUE', '550e8400-e29b-41d4-a716-446655440009'::uuid),
  ('E85', '550e8400-e29b-41d4-a716-446655440010'::uuid),
  ('B20', '550e8400-e29b-41d4-a716-446655440011'::uuid),
  ('EV', '550e8400-e29b-41d4-a716-446655440012'::uuid)
ON CONFLICT (external_code) DO NOTHING;

ALTER TABLE price_submissions
ADD COLUMN IF NOT EXISTS source_hash VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_submissions_source_hash_unique
ON price_submissions(source_hash)
WHERE source_hash IS NOT NULL;
