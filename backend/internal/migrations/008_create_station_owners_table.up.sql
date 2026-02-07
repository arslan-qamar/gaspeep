-- 008_create_station_owners_table.up.sql
CREATE TABLE IF NOT EXISTS station_owners (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_documents TEXT,
  contact_info VARCHAR(500),
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_station_owners_user ON station_owners(user_id);
CREATE INDEX idx_station_owners_status ON station_owners(verification_status);
