-- Migration 023: Field Health History
-- Adds a table for tracking real health scores over time per field
-- to eliminate the use of fabricated trend data in the intelligence dashboard.

CREATE TABLE IF NOT EXISTS field_health_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    dimensions JSONB,
    source TEXT NOT NULL DEFAULT 'health_score',
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_health_history_field_date 
    ON field_health_history (field_id, observed_at DESC);

-- Additionally, ensure field_weather_snapshots has columns for advanced metrics if not present
ALTER TABLE field_weather_snapshots ADD COLUMN IF NOT EXISTS wind_speed NUMERIC;
ALTER TABLE field_weather_snapshots ADD COLUMN IF NOT EXISTS wind_direction NUMERIC;
ALTER TABLE field_weather_snapshots ADD COLUMN IF NOT EXISTS precipitation_probability NUMERIC;
ALTER TABLE field_weather_snapshots ADD COLUMN IF NOT EXISTS et0_mm NUMERIC;
