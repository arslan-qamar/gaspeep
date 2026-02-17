-- 011_add_owner_to_stations_table.up.sql
-- Add owner_id column to stations table to track which station owner manages the station

ALTER TABLE stations
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES station_owners(id) ON DELETE SET NULL;

-- Add a verification_status column to track claim verification
ALTER TABLE stations
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stations_owner_id ON stations(owner_id);
CREATE INDEX IF NOT EXISTS idx_stations_verification_status ON stations(verification_status);
