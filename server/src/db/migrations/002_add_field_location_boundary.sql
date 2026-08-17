-- AgriMesh Migration 002: Add location and boundary to fields
-- Run order: second

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS location_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS area_hectares FLOAT,
  ADD COLUMN IF NOT EXISTS boundary_geojson JSONB;
