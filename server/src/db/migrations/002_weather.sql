-- AgriMesh Migration 002: Weather data
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS field_weather_snapshots (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id            UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  snapshot_date       DATE         NOT NULL,
  source              VARCHAR(100) NOT NULL,
  rainfall_mm         NUMERIC(8,2) NOT NULL DEFAULT 0,
  temp_min            NUMERIC(6,2) NOT NULL,
  temp_max            NUMERIC(6,2) NOT NULL,
  humidity_pct        NUMERIC(5,2) NOT NULL,
  forecast_confidence VARCHAR(10)  NOT NULL CHECK (forecast_confidence IN ('high','medium','low')),
  is_forecast         BOOLEAN      NOT NULL DEFAULT FALSE,
  ingested_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(field_id, snapshot_date, is_forecast)
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_field_date ON field_weather_snapshots(field_id, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS weather_event_flags (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id     UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  event_type   VARCHAR(50)  NOT NULL CHECK (event_type IN ('rain_expected','heat_event','dry_spell','humidity_spike','frost_warning')),
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  severity     VARCHAR(10)  NOT NULL CHECK (severity IN ('low','medium','high')),
  message      TEXT         NOT NULL,
  generated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_flags_field_id ON weather_event_flags(field_id);
