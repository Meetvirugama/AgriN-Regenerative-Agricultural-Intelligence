-- AgriMesh Migration 029: Enhance OTP table for password resets via email
-- Depends on: 008_auth.sql, 009_email_auth.sql

-- Rename phone_number to identifier to support both phone and email
ALTER TABLE otp_codes RENAME COLUMN phone_number TO identifier;

-- Increase column size to accommodate emails
ALTER TABLE otp_codes ALTER COLUMN identifier TYPE VARCHAR(255);

-- Rename the index (Optional but good practice)
ALTER INDEX IF EXISTS idx_otp_phone_valid RENAME TO idx_otp_identifier_valid;
