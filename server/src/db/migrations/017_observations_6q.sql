-- Migration 017: Add 6-Question columns + farmer observations to field_observations
-- The AI returns what_is_happening / why_is_it_happening / action_timing
-- but these were omitted from migration 016.
-- Also adds farmer_observations to persist the pre-diagnosis Q&A.

ALTER TABLE field_observations
  ADD COLUMN IF NOT EXISTS what_is_happening    TEXT,
  ADD COLUMN IF NOT EXISTS why_is_it_happening  TEXT,
  ADD COLUMN IF NOT EXISTS action_timing        TEXT,
  ADD COLUMN IF NOT EXISTS farmer_observations  JSONB;

-- Index for fast lookup of high-severity, unresolved diagnoses
CREATE INDEX IF NOT EXISTS idx_observations_requires_expert
  ON field_observations(requires_expert)
  WHERE requires_expert = TRUE;
