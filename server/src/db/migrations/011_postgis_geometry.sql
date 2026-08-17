-- AgriMesh Migration 011: Enable PostGIS and upgrade field geometry
-- Depends on: 001_core_fields.sql, 002_add_field_location_boundary.sql

-- Enable PostGIS extension (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add proper PostGIS geometry columns
ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS geometry GEOMETRY(POLYGON, 4326),
  ADD COLUMN IF NOT EXISTS centroid GEOMETRY(POINT, 4326);

-- Migrate existing JSONB boundary_geojson → PostGIS geometry
UPDATE fields
SET geometry = ST_GeomFromGeoJSON(boundary_geojson::text)
WHERE boundary_geojson IS NOT NULL
  AND geometry IS NULL;

-- Compute centroids from geometry
UPDATE fields
SET centroid = ST_Centroid(geometry)
WHERE geometry IS NOT NULL
  AND centroid IS NULL;

-- For fields with lat/lng but no polygon boundary, create a point geometry
-- so centroid is always available for weather/soil lookups
UPDATE fields
SET centroid = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL
  AND lng IS NOT NULL
  AND centroid IS NULL;

-- Spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_fields_geometry ON fields USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_fields_centroid ON fields USING GIST(centroid);
