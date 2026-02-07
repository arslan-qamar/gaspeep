-- 004_create_fuel_prices_table.up.sql
CREATE TABLE IF NOT EXISTS fuel_prices (
  id UUID PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  price DECIMAL(10, 3) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  unit VARCHAR(50) NOT NULL DEFAULT 'per_liter',
  last_updated_at TIMESTAMP,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
  confirmation_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fuel_prices_station ON fuel_prices(station_id);
CREATE INDEX idx_fuel_prices_fuel_type ON fuel_prices(fuel_type_id);
CREATE UNIQUE INDEX idx_fuel_prices_unique ON fuel_prices(station_id, fuel_type_id);
