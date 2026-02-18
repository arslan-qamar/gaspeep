-- 017_standardize_verification_status_values.up.sql
-- Standardize verification_status values across all tables to match frontend enum
-- Frontend expects: 'verified' | 'pending' | 'rejected' | 'not_verified'
-- This migration updates existing values and changes default for new records

-- Update station_owners table
ALTER TABLE station_owners
  ALTER COLUMN verification_status SET DEFAULT 'not_verified';

-- Update fuel_prices table (unverified -> not_verified)
UPDATE fuel_prices SET verification_status = 'not_verified' WHERE verification_status = 'unverified';
ALTER TABLE fuel_prices
  ALTER COLUMN verification_status SET DEFAULT 'not_verified';

-- Update stations table (unverified -> not_verified)
UPDATE stations SET verification_status = 'not_verified' WHERE verification_status = 'unverified';
ALTER TABLE stations
  ALTER COLUMN verification_status SET DEFAULT 'not_verified';
