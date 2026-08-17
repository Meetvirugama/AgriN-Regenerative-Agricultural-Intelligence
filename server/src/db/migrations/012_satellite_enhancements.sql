-- AgriMesh Migration 012: Satellite tile enhancements for real Sentinel-2 data
-- Depends on: 004_satellite.sql

-- Add detailed NDVI statistics and scene metadata
ALTER TABLE satellite_tiles
  ADD COLUMN IF NOT EXISTS ndvi_median      NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS ndvi_min         NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS ndvi_max         NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS ndvi_std         NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS ndmi_mean        NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS scene_id         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS band_resolution_m INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS cloud_obstructed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pixel_count      INTEGER,
  ADD COLUMN IF NOT EXISTS observation_date DATE;

-- Populate observation_date from capture_date for existing rows
UPDATE satellite_tiles
SET observation_date = capture_date
WHERE observation_date IS NULL;

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_satellite_tiles_obs_date 
  ON satellite_tiles(field_id, observation_date DESC)
  WHERE cloud_obstructed = FALSE;
