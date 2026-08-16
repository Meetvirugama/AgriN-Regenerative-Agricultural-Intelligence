-- AgriMesh Migration 003: Soil intelligence
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS soil_profiles (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id              UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  source                VARCHAR(30)  NOT NULL CHECK (source IN ('lab_report','regional_inference')),
  texture               VARCHAR(30)  NOT NULL CHECK (texture IN ('sandy','loam','clay','sandy_loam','clay_loam','silt_loam')),
  organic_matter_pct    NUMERIC(5,2) NOT NULL,
  nitrogen_level        VARCHAR(10)  NOT NULL CHECK (nitrogen_level IN ('low','medium','high')),
  phosphorus_level      VARCHAR(10)  NOT NULL CHECK (phosphorus_level IN ('low','medium','high')),
  potassium_level       VARCHAR(10)  NOT NULL CHECK (potassium_level IN ('low','medium','high')),
  water_holding_capacity VARCHAR(10) NOT NULL CHECK (water_holding_capacity IN ('low','medium','high')),
  ph                    NUMERIC(4,2) NOT NULL,
  report_date           DATE         NOT NULL,
  raw_document_url      TEXT,
  summary_text          TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Most recent profile per field is retrieved with ORDER BY created_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_soil_profiles_field_id ON soil_profiles(field_id, created_at DESC);

CREATE TABLE IF NOT EXISTS regional_soil_baselines (
  region_id             VARCHAR(50)  PRIMARY KEY,
  texture               VARCHAR(30)  NOT NULL,
  avg_organic_matter    NUMERIC(5,2) NOT NULL,
  avg_nitrogen          VARCHAR(10)  NOT NULL,
  avg_phosphorus        VARCHAR(10)  NOT NULL,
  avg_potassium         VARCHAR(10)  NOT NULL,
  avg_ph                NUMERIC(4,2) NOT NULL,
  water_holding_capacity VARCHAR(10) NOT NULL
);

-- Seed regional baselines
INSERT INTO regional_soil_baselines VALUES
  ('punjab', 'silt_loam', 1.8, 'medium', 'medium', 'high', 7.8, 'medium'),
  ('maharashtra', 'clay', 0.9, 'low', 'low', 'medium', 7.2, 'high'),
  ('karnataka', 'loam', 1.2, 'low', 'medium', 'medium', 6.5, 'medium'),
  ('US-MW', 'silt_loam', 3.5, 'medium', 'medium', 'high', 6.8, 'high')
ON CONFLICT (region_id) DO NOTHING;
