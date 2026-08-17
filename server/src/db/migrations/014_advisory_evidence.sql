-- AgriMesh Migration 014: Add Gemini evidence column to advisory_records
-- Also add trigger_type column for advisory source tracking

ALTER TABLE advisory_records
  ADD COLUMN IF NOT EXISTS trigger_type  VARCHAR(50) DEFAULT 'ai_generated',
  ADD COLUMN IF NOT EXISTS gemini_evidence JSONB;

-- Relax severity constraint to allow Medium/High/Critical from Gemini
ALTER TABLE advisory_records DROP CONSTRAINT IF EXISTS advisory_records_severity_check;
ALTER TABLE advisory_records ADD CONSTRAINT advisory_records_severity_check
  CHECK (severity IN ('Low', 'Medium', 'Amber', 'High', 'Red', 'Critical'));

-- Add irrigation_type to fields (needed for advisory context)
ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(50);
