-- AgriMesh Migration 015: Add irrigation_type to fields table
ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(50);
