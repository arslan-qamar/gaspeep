-- 005_create_price_submissions_table.up.sql
CREATE TABLE IF NOT EXISTS price_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  price DECIMAL(10, 3) NOT NULL,
  submission_method VARCHAR(50) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_confidence FLOAT NOT NULL DEFAULT 0,
  photo_url VARCHAR(500),
  voice_recording_url VARCHAR(500),
  ocr_data TEXT,
  moderator_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_submissions_user ON price_submissions(user_id);
CREATE INDEX idx_price_submissions_station ON price_submissions(station_id);
CREATE INDEX idx_price_submissions_status ON price_submissions(moderation_status);
CREATE INDEX idx_price_submissions_submitted_at ON price_submissions(submitted_at);
