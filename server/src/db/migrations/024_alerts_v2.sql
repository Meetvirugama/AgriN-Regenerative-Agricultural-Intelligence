-- Migration 024: Alerts v2 
-- Adds read tracking, sources, confidence, and metadata for robust alerts.

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,3);

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS metadata JSONB;
