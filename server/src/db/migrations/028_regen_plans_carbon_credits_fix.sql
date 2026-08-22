-- Migration 028: Ensure carbon_credits_est column exists on regen_plans
-- The column is defined in migration 019 but may be missing on instances where
-- an older schema snapshot was applied. This migration is fully idempotent.

ALTER TABLE regen_plans
  ADD COLUMN IF NOT EXISTS carbon_credits_est NUMERIC(10,2);
