-- 009_create_broadcasts_table.up.sql
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY,
  station_owner_id UUID NOT NULL REFERENCES station_owners(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_radius_km INT NOT NULL DEFAULT 10,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  broadcast_status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  target_fuel_types TEXT,
  views INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_broadcasts_owner ON broadcasts(station_owner_id);
CREATE INDEX idx_broadcasts_station ON broadcasts(station_id);
CREATE INDEX idx_broadcasts_status ON broadcasts(broadcast_status);
CREATE INDEX idx_broadcasts_dates ON broadcasts(start_date, end_date);
