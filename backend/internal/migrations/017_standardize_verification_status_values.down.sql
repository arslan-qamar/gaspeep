-- 017_standardize_verification_status_values.down.sql
-- Rollback verification status standardization

-- Revert station_owners table default
ALTER TABLE station_owners
  ALTER COLUMN verification_status SET DEFAULT 'pending';

-- Revert fuel_prices table
UPDATE fuel_prices SET verification_status = 'unverified' WHERE verification_status = 'not_verified';
ALTER TABLE fuel_prices
  ALTER COLUMN verification_status SET DEFAULT 'unverified';

-- Revert stations table
UPDATE stations SET verification_status = 'unverified' WHERE verification_status = 'not_verified';
ALTER TABLE stations
  ALTER COLUMN verification_status SET DEFAULT 'unverified';
