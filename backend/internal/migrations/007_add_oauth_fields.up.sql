-- Add OAuth/provider fields to users table
ALTER TABLE users
ADD COLUMN oauth_provider VARCHAR(64),
ADD COLUMN oauth_provider_id VARCHAR(128),
ADD COLUMN avatar_url TEXT,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_provider_id ON users (oauth_provider, oauth_provider_id);
