-- Migration 016: Field Observations + Diagnosis (Layer 07)
-- Every farmer photo submission is stored immutably.
-- Diagnosis confidence comes from 4 evidence layers: image + weather + satellite + soil.

CREATE TABLE IF NOT EXISTS field_observations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id                UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,

  -- Image
  image_url               TEXT,
  image_mime_type         TEXT DEFAULT 'image/jpeg',

  -- Observation GPS (may differ from field centroid)
  latitude                DOUBLE PRECISION,
  longitude               DOUBLE PRECISION,

  -- Crop context at time of observation
  crop_type               TEXT,
  growth_stage            TEXT,
  days_since_sowing       INT,

  -- Structured diagnosis output
  condition_name          TEXT,
  condition_category      TEXT CHECK (condition_category IN (
                            'disease','pest','nutrient_deficiency',
                            'water_stress','heat_stress','healthy','unknown'
                          )),
  confidence              FLOAT CHECK (confidence BETWEEN 0 AND 1),
  severity                TEXT CHECK (severity IN ('low','medium','high','critical','none','unknown')),
  treatment_recommendation TEXT,

  -- Differential diagnosis top-3: [{condition, probability, rationale}]
  differential_diagnosis  JSONB,

  -- Evidence trail: [{source, finding, supports_primary}]
  evidence                JSONB,

  -- Context snapshots (immutable record of what Gemini saw)
  weather_snapshot        JSONB,
  satellite_snapshot      JSONB,
  soil_snapshot           JSONB,

  -- Quality flags
  image_quality           TEXT DEFAULT 'unknown' CHECK (image_quality IN ('good','fair','poor','unknown')),
  escalation_triggered    BOOLEAN DEFAULT FALSE,
  requires_expert         BOOLEAN DEFAULT FALSE,

  -- What to monitor next and when (from AI)
  monitor                 TEXT,

  -- Feedback loop: farmer outcome after acting on advice (Layer 08 field memory)
  outcome                 TEXT CHECK (outcome IN ('improved','worsened','unchanged','unknown')) DEFAULT 'unknown',
  outcome_notes           TEXT,
  outcome_recorded_at     TIMESTAMPTZ,

  -- Model traceability
  model_name              TEXT DEFAULT 'gemini-2.0-flash',
  model_version           TEXT DEFAULT '001',

  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_field     ON field_observations(field_id);
CREATE INDEX IF NOT EXISTS idx_observations_submitted ON field_observations(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_category  ON field_observations(condition_category);
CREATE INDEX IF NOT EXISTS idx_observations_severity  ON field_observations(severity);

