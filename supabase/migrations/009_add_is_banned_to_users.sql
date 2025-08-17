-- Add is_banned column to users table
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

-- Create index for better performance when filtering banned users
CREATE INDEX idx_users_is_banned ON users(is_banned);

-- Add comment to the column
COMMENT ON COLUMN users.is_banned IS 'Whether the user is banned from the system';