-- AgriMesh Migration 013: Field observations and image pipeline
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS field_observations (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id      UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  image_url     TEXT,
  latitude      FLOAT,
  longitude     FLOAT,
  observed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  crop_stage    VARCHAR(50),
  notes         TEXT,
  -- AI diagnosis result (null until processed)
  diagnosis     JSONB,       -- { condition, confidence, category, explanation }
  model_version VARCHAR(50),
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_field_id 
  ON field_observations(field_id, observed_at DESC);
