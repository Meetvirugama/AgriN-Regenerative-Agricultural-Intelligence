-- AgriMesh Migration 021: Add crop_type to regen_plans
-- Depends on: 019_regen_plans.sql

ALTER TABLE regen_plans ADD COLUMN IF NOT EXISTS crop_type TEXT;
