-- Migration 018: Chat Messages
-- Adds the chat_messages table for persisting real AI conversation history
-- per farmer (and optionally scoped to a specific field).

CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id   UUID        REFERENCES farmers(id) ON DELETE CASCADE,
    field_id    UUID        REFERENCES fields(id) ON DELETE SET NULL,
    role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-farmer history lookup (newest first)
CREATE INDEX IF NOT EXISTS idx_chat_messages_farmer_created
    ON chat_messages (farmer_id, created_at DESC);

-- Index for field-scoped queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_field
    ON chat_messages (field_id, created_at DESC);
