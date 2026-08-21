-- AgriMesh Migration 020: Allow null NDVI when cloudy
ALTER TABLE satellite_tiles ALTER COLUMN ndvi_mean DROP NOT NULL;
ALTER TABLE satellite_tiles ALTER COLUMN moisture_proxy DROP NOT NULL;
