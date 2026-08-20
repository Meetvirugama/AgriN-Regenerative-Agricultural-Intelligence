-- Migration 019: Regen Plans
-- Persists regenerative agriculture plans to Postgres instead of the
-- in-memory InMemoryDB.regenPlans Map (which is lost on server restart).

CREATE TABLE IF NOT EXISTS regen_plans (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id     UUID        NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_type    TEXT,
    practices    JSONB       NOT NULL DEFAULT '[]',
    next_season_options JSONB NOT NULL DEFAULT '[]',
    carbon_credits_est  NUMERIC(10,2),
    summary      TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Allow only one active plan per field at a time
    UNIQUE (field_id)
);

-- Index for fast field lookup
CREATE INDEX IF NOT EXISTS idx_regen_plans_field ON regen_plans (field_id);
-- Index for TTL checks (find plans older than 24 hours)
CREATE INDEX IF NOT EXISTS idx_regen_plans_generated_at ON regen_plans (generated_at DESC);
