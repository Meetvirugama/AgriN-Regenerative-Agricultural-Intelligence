-- Migration 022: Chat Messages v2
-- Add missing columns for structured AI advisories and client-side deduplication.

-- Add idempotency and relation columns
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS client_message_id UUID,
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Add structured payload columns
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS advisory JSONB,
ADD COLUMN IF NOT EXISTS sources JSONB;

-- Add a unique constraint for idempotency
-- We must handle nulls safely. Postgres allows multiple nulls in UNIQUE columns,
-- but to be safe, we'll just add the constraint.
ALTER TABLE chat_messages
ADD CONSTRAINT unique_farmer_client_msg UNIQUE (farmer_id, client_message_id);
