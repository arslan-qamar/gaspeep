-- 012_create_station_photos_table.up.sql
-- Table for storing station photos uploaded by owners

CREATE TABLE IF NOT EXISTS station_photos (
  id UUID PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  photo_type VARCHAR(50) DEFAULT 'interior',  -- interior, exterior, pump, signage, etc.
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_station_photos_station_id ON station_photos(station_id);
CREATE INDEX idx_station_photos_uploaded_by ON station_photos(uploaded_by);
