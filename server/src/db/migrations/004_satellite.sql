-- AgriMesh Migration 004: Satellite intelligence
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS satellite_tiles (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id         UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  capture_date     DATE         NOT NULL,
  provider         VARCHAR(50)  NOT NULL DEFAULT 'mock',
  ndvi_mean        NUMERIC(6,4) NOT NULL,
  ndvi_by_subregion JSONB       NOT NULL DEFAULT '[]',
  moisture_proxy   NUMERIC(6,4) NOT NULL DEFAULT 0,
  cloud_cover_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  tile_url         TEXT,
  ingested_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satellite_tiles_field_date ON satellite_tiles(field_id, capture_date DESC);

CREATE TABLE IF NOT EXISTS field_health_trends (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id             UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  trend_date           DATE         NOT NULL,
  ndvi_trend_direction VARCHAR(20)  NOT NULL CHECK (ndvi_trend_direction IN ('improving','stable','declining')),
  moisture_trend       VARCHAR(20)  NOT NULL CHECK (moisture_trend IN ('improving','stable','declining')),
  ndvi_value           NUMERIC(6,4) NOT NULL,
  moisture_value       NUMERIC(6,4) NOT NULL,
  summary_text         TEXT         NOT NULL,
  computed_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(field_id, trend_date)
);

CREATE INDEX IF NOT EXISTS idx_health_trends_field_date ON field_health_trends(field_id, trend_date DESC);

CREATE TABLE IF NOT EXISTS anomaly_flags (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id          UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  subregion_geometry JSONB,
  subregion_label   VARCHAR(100),
  detected_date     DATE         NOT NULL,
  anomaly_type      VARCHAR(50)  NOT NULL CHECK (anomaly_type IN ('vegetation_decline','moisture_drop')),
  severity          VARCHAR(20)  NOT NULL CHECK (severity IN ('low','moderate','high')),
  still_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  resolved_date     DATE
);

CREATE INDEX IF NOT EXISTS idx_anomaly_flags_field_active ON anomaly_flags(field_id, still_active);
