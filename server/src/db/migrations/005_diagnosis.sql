-- AgriMesh Migration 005: Disease diagnosis events
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS diagnosis_events (
  id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id                UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  photo_url               TEXT         NOT NULL,
  submitted_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  crop_type               VARCHAR(100) NOT NULL,
  growth_stage            VARCHAR(50)  NOT NULL,
  recent_weather_snapshot JSONB,
  field_health_context    JSONB,
  predicted_category      VARCHAR(50)  NOT NULL CHECK (predicted_category IN (
    'disease','pest','nutrient_deficiency','water_stress','heat_stress','unknown'
  )),
  predicted_label         VARCHAR(255) NOT NULL,
  confidence              NUMERIC(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  severity                VARCHAR(20)  NOT NULL CHECK (severity IN ('low','moderate','high')),
  recommended_action_text TEXT,
  escalation_triggered    BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_field_id ON diagnosis_events(field_id, submitted_at DESC);
