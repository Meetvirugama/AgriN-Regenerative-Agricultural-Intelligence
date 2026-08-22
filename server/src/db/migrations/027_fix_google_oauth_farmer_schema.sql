-- AgriMesh Migration 027: Allow flexible phone_number and wider varchar for Google OAuth
-- Allows phone_number to be NULL for Google OAuth accounts
-- Expands phone_number field to VARCHAR(255) to prevent overflow errors

ALTER TABLE farmers ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN phone_number TYPE VARCHAR(255);

ALTER TABLE auth_audit_log ALTER COLUMN phone_number TYPE VARCHAR(255);
ALTER TABLE otp_codes ALTER COLUMN phone_number TYPE VARCHAR(255);
