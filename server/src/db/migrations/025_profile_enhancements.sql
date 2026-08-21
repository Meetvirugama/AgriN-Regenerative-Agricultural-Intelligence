-- Migration 025: Profile enhancements
-- Adds location, profile image, experience, and email to farmers table

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS farming_experience_years INT;
