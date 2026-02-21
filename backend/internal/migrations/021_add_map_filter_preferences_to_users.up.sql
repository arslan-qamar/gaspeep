ALTER TABLE users
ADD COLUMN IF NOT EXISTS map_filter_preferences JSONB;
