-- Seed data for Gas Peep application
-- This script populates the database with sample data for testing
-- Note: Fuel types are already seeded by migration 003

BEGIN;

-- Insert Stations (Sydney area) using gen_random_uuid()
INSERT INTO stations (id, name, brand, address, location, latitude, longitude, operating_hours, amenities, last_verified_at) VALUES
-- Sydney CBD
(gen_random_uuid(), '7-Eleven Sydney Central', '7-Eleven', '789 George St, Sydney NSW 2000', ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326), -33.8688, 151.2093, '24 Hours', '["ATM", "Convenience Store", "Car Wash"]', NOW()),
(gen_random_uuid(), 'Caltex Woolworths Metro', 'Caltex', '500 Oxford St, Bondi Junction NSW 2022', ST_SetSRID(ST_MakePoint(151.2478, -33.8913), 4326), -33.8913, 151.2478, '6:00 AM - 11:00 PM', '["Rewards Program", "Convenience Store", "Air Pump"]', NOW()),
(gen_random_uuid(), 'Shell Coles Express', 'Shell', '200 Pitt St, Sydney NSW 2000', ST_SetSRID(ST_MakePoint(151.2099, -33.8650), 4326), -33.8650, 151.2099, '24 Hours', '["Rewards Program", "ATM", "Coffee Shop"]', NOW()),
(gen_random_uuid(), 'BP Connect Darling Harbour', 'BP', '100 Murray St, Pyrmont NSW 2009', ST_SetSRID(ST_MakePoint(151.1968, -33.8738), 4326), -33.8738, 151.1968, '5:00 AM - 11:00 PM', '["Convenience Store", "EV Charging", "Air Pump"]', NOW()),
-- North Sydney
(gen_random_uuid(), 'Ampol North Sydney', 'Ampol', '180 Pacific Hwy, North Sydney NSW 2060', ST_SetSRID(ST_MakePoint(151.2070, -33.8378), 4326), -33.8378, 151.2070, '24 Hours', '["ATM", "Convenience Store", "Restrooms"]', NOW()),
(gen_random_uuid(), '7-Eleven Crows Nest', '7-Eleven', '85 Willoughby Rd, Crows Nest NSW 2065', ST_SetSRID(ST_MakePoint(151.1989, -33.8266), 4326), -33.8266, 151.1989, '24 Hours', '["ATM", "Convenience Store"]', NOW()),
-- Eastern Suburbs
(gen_random_uuid(), 'Caltex Star Mart Bondi', 'Caltex', '350 Old South Head Rd, Bondi NSW 2026', ST_SetSRID(ST_MakePoint(151.2624, -33.8901), 4326), -33.8901, 151.2624, '6:00 AM - 10:00 PM', '["Car Wash", "Convenience Store", "Air Pump"]', NOW()),
(gen_random_uuid(), 'Shell Randwick', 'Shell', '73 Belmore Rd, Randwick NSW 2031', ST_SetSRID(ST_MakePoint(151.2426, -33.9147), 4326), -33.9147, 151.2426, '24 Hours', '["Convenience Store", "ATM", "LPG"]', NOW()),
-- Inner West
(gen_random_uuid(), 'BP Newtown', 'BP', '430 King St, Newtown NSW 2042', ST_SetSRID(ST_MakePoint(151.1789, -33.8989), 4326), -33.8989, 151.1789, '24 Hours', '["EV Charging", "Convenience Store", "Air Pump"]', NOW()),
(gen_random_uuid(), 'Metro Petroleum Marrickville', 'Metro', '370 Marrickville Rd, Marrickville NSW 2204', ST_SetSRID(ST_MakePoint(151.1547, -33.9116), 4326), -33.9116, 151.1547, '6:00 AM - 9:00 PM', '["ATM", "Air Pump"]', NOW()),
-- Western Sydney
(gen_random_uuid(), '7-Eleven Parramatta', '7-Eleven', '159 Church St, Parramatta NSW 2150', ST_SetSRID(ST_MakePoint(151.0042, -33.8158), 4326), -33.8158, 151.0042, '24 Hours', '["ATM", "Convenience Store", "Car Wash"]', NOW()),
(gen_random_uuid(), 'Caltex Westfield Parramatta', 'Caltex', '159-175 Church St, Parramatta NSW 2150', ST_SetSRID(ST_MakePoint(151.0035, -33.8143), 4326), -33.8143, 151.0035, '6:00 AM - 11:00 PM', '["Rewards Program", "Convenience Store", "Restrooms"]', NOW()),
-- Airport Area
(gen_random_uuid(), 'Shell Airport', 'Shell', '2 Airport Dr, Sydney Airport NSW 2020', ST_SetSRID(ST_MakePoint(151.1852, -33.9399), 4326), -33.9399, 151.1852, '24 Hours', '["ATM", "Convenience Store", "Restrooms", "Car Wash"]', NOW()),
(gen_random_uuid(), 'BP Mascot', 'BP', '1399 Botany Rd, Mascot NSW 2020', ST_SetSRID(ST_MakePoint(151.1933, -33.9251), 4326), -33.9251, 151.1933, '24 Hours', '["EV Charging", "Convenience Store", "Air Pump"]', NOW()),
-- Northern Beaches
(gen_random_uuid(), 'Caltex Manly', 'Caltex', '54 Pittwater Rd, Manly NSW 2095', ST_SetSRID(ST_MakePoint(151.2854, -33.7969), 4326), -33.7969, 151.2854, '6:00 AM - 10:00 PM', '["Car Wash", "Convenience Store", "Air Pump"]', NOW());

-- Now insert some fuel prices for these stations
-- We'll use a WITH clause to reference the station IDs
WITH station_ids AS (
  SELECT id, name FROM stations ORDER BY created_at DESC LIMIT 15
)
INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
SELECT 
  gen_random_uuid(),
  s.id,
  '550e8400-e29b-41d4-a716-446655440001'::uuid, -- E10
  (1.80 + (RANDOM() * 0.15))::numeric(10,2), -- Random price between 1.80 and 1.95
  'AUD',
  'litre',
  NOW() - (RANDOM() * INTERVAL '8 hours'),
  CASE WHEN RANDOM() > 0.3 THEN 'verified' ELSE 'unverified' END,
  FLOOR(RANDOM() * 5)::int
FROM station_ids s;

WITH station_ids AS (
  SELECT id, name FROM stations ORDER BY created_at DESC LIMIT 15
)
INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
SELECT 
  gen_random_uuid(),
  s.id,
  '550e8400-e29b-41d4-a716-446655440002'::uuid, -- Unleaded 91
  (1.85 + (RANDOM() * 0.15))::numeric(10,2),
  'AUD',
  'litre',
  NOW() - (RANDOM() * INTERVAL '8 hours'),
  CASE WHEN RANDOM() > 0.3 THEN 'verified' ELSE 'unverified' END,
  FLOOR(RANDOM() * 6)::int
FROM station_ids s;

WITH station_ids AS (
  SELECT id, name FROM stations ORDER BY created_at DESC LIMIT 15
)
INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
SELECT 
  gen_random_uuid(),
  s.id,
  '550e8400-e29b-41d4-a716-446655440003'::uuid, -- Diesel
  (1.82 + (RANDOM() * 0.15))::numeric(10,2),
  'AUD',
  'litre',
  NOW() - (RANDOM() * INTERVAL '8 hours'),
  CASE WHEN RANDOM() > 0.3 THEN 'verified' ELSE 'unverified' END,
  FLOOR(RANDOM() * 4)::int
FROM station_ids s;

WITH station_ids AS (
  SELECT id, name FROM stations ORDER BY created_at DESC LIMIT 15
)
INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
SELECT 
  gen_random_uuid(),
  s.id,
  '550e8400-e29b-41d4-a716-446655440005'::uuid, -- U95
  (2.00 + (RANDOM() * 0.15))::numeric(10,2),
  'AUD',
  'litre',
  NOW() - (RANDOM() * INTERVAL '8 hours'),
  CASE WHEN RANDOM() > 0.3 THEN 'verified' ELSE 'unverified' END,
  FLOOR(RANDOM() * 4)::int
FROM station_ids s
WHERE RANDOM() > 0.3; -- Only some stations have U95

WITH station_ids AS (
  SELECT id, name FROM stations ORDER BY created_at DESC LIMIT 15
)
INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
SELECT 
  gen_random_uuid(),
  s.id,
  '550e8400-e29b-41d4-a716-446655440007'::uuid, -- LPG
  (0.92 + (RANDOM() * 0.10))::numeric(10,2),
  'AUD',
  'litre',
  NOW() - (RANDOM() * INTERVAL '12 hours'),
  'verified',
  FLOOR(RANDOM() * 3)::int
FROM station_ids s
WHERE RANDOM() > 0.7; -- Only few stations have LPG

COMMIT;

-- Display summary
SELECT 
    (SELECT COUNT(*) FROM fuel_types) as fuel_types_count,
    (SELECT COUNT(*) FROM stations) as stations_count,
    (SELECT COUNT(*) FROM fuel_prices) as prices_count;
-- Sydney CBD
