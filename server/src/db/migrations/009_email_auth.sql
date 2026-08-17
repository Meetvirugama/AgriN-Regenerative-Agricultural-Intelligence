-- AgriMesh Migration 009: Email/Password Authentication
-- Depends on: 008_auth.sql

-- 1. Add email and password_hash to farmers table
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);
