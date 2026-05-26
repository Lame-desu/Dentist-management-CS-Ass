-- Migration 002: Email Verification Support
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_token_expires_at TIMESTAMP;

-- Make password_hash nullable (for invited users who haven't set password yet)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);

-- Mark ALL existing users as verified (so demo/seed users can still login)
UPDATE users SET is_email_verified = true WHERE is_email_verified IS NULL OR is_email_verified = false;
