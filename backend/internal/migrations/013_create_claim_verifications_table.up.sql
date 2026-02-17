-- 013_create_claim_verifications_table.up.sql
-- Table for tracking station ownership claims and their verification status

CREATE TABLE IF NOT EXISTS claim_verifications (
  id UUID PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  station_owner_id UUID NOT NULL REFERENCES station_owners(id) ON DELETE CASCADE,
  verification_method VARCHAR(50) NOT NULL,  -- 'document', 'phone', 'email', 'in_person'
  verification_documents TEXT,  -- JSON array of document URLs
  phone_number VARCHAR(20),
  email VARCHAR(255),
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  rejection_reason TEXT,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claim_verifications_station_id ON claim_verifications(station_id);
CREATE INDEX idx_claim_verifications_owner_id ON claim_verifications(station_owner_id);
CREATE INDEX idx_claim_verifications_status ON claim_verifications(verification_status);
