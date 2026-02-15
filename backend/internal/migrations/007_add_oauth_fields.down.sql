-- Remove OAuth/provider fields from users table
ALTER TABLE users
DROP COLUMN IF EXISTS oauth_provider,
DROP COLUMN IF EXISTS oauth_provider_id,
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS email_verified;

DROP INDEX IF EXISTS idx_users_oauth_provider_provider_id;
