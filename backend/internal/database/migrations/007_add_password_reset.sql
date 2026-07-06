ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET password_reset_required = TRUE WHERE email = 'admin@laundry.com';
