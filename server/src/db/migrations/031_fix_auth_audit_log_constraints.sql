-- AgriMesh Migration 031: Drop restrictive event_type constraint on auth_audit_log
-- Depends on: 008_auth.sql

-- Drop the check constraint so modern auth event types (login_password, login_google, register_email, etc.) can be recorded
ALTER TABLE auth_audit_log DROP CONSTRAINT IF EXISTS auth_audit_log_event_type_check;

-- Ensure phone_number / identifier column is wide enough for emails and phone numbers
ALTER TABLE auth_audit_log ALTER COLUMN phone_number TYPE VARCHAR(255);
