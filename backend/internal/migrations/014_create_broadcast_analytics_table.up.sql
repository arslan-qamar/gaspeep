-- 014_create_broadcast_analytics_table.up.sql
-- Table for tracking broadcast engagement metrics

CREATE TABLE IF NOT EXISTS broadcast_analytics (
  id UUID PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered INT NOT NULL DEFAULT 0,
  opened INT NOT NULL DEFAULT 0,
  clicked_through INT NOT NULL DEFAULT 0,
  unsubscribed INT NOT NULL DEFAULT 0,
  bounced INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_broadcast_analytics_broadcast_id ON broadcast_analytics(broadcast_id);
CREATE INDEX idx_broadcast_analytics_recorded_at ON broadcast_analytics(recorded_at);
