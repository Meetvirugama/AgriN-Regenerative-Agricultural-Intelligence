-- AgriMesh Migration 006: Advisory records and farmer feedback
-- Depends on: 001_core_fields.sql

CREATE TABLE IF NOT EXISTS advisory_records (
  id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id                    UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  generated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  severity                    VARCHAR(20)  NOT NULL CHECK (severity IN ('Low','Amber','Red')),
  action_text                 TEXT         NOT NULL,
  action_deadline             VARCHAR(100),
  what_text                   TEXT,
  why_text                    TEXT,
  monitor_text                TEXT,
  historical_parallel_callout TEXT,
  source_layers               TEXT[]       NOT NULL DEFAULT '{}',
  is_active                   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_advisory_field_active ON advisory_records(field_id, is_active, generated_at DESC);

CREATE TABLE IF NOT EXISTS farmer_advisory_responses (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisory_id UUID         NOT NULL REFERENCES advisory_records(id) ON DELETE CASCADE,
  field_id    UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  action      VARCHAR(30)  NOT NULL CHECK (action IN ('followed','ignored','overridden')),
  reason      TEXT,                          -- populated only for 'overridden'
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_advisory_id ON farmer_advisory_responses(advisory_id);

-- ─── Feedback & Outcome Verification ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback_events (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisory_id         UUID         REFERENCES advisory_records(id) ON DELETE SET NULL,
  field_id            UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  prompted_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  farmer_response     VARCHAR(20)  CHECK (farmer_response IN ('helped','didnt_help','no_response')),
  follow_up_photo_url TEXT,
  follow_up_note      TEXT,
  collected_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_field_id ON feedback_events(field_id);

-- ─── Field Timeline ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS field_timeline_entries (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id          UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  entry_date        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  entry_type        VARCHAR(30)  NOT NULL CHECK (entry_type IN (
    'advisory','diagnosis','weather_event','farmer_note','satellite_anomaly'
  )),
  summary_text      TEXT         NOT NULL,
  linked_record_id  UUID,
  season_label      VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_timeline_field_date ON field_timeline_entries(field_id, entry_date DESC);
