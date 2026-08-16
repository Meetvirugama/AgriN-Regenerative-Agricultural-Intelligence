-- AgriMesh Migration 007: Escalation tickets and regen plans
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS escalation_tickets (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id     UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  farmer_id    UUID         NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  source       VARCHAR(50)  NOT NULL,
  reason       VARCHAR(50)  NOT NULL CHECK (reason IN ('high_severity','low_confidence','farmer_request')),
  context_data JSONB,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','acknowledged','resolved')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON escalation_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_field ON escalation_tickets(field_id);

-- ─── Regen Plans ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS regen_plans (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id     UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  practices    JSONB        NOT NULL DEFAULT '[]',
  next_season_options JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Latest plan per field is always ORDER BY generated_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_regen_plans_field ON regen_plans(field_id, generated_at DESC);

-- ─── Migration Tracking ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) PRIMARY KEY,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
