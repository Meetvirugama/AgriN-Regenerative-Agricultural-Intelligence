-- AgriMesh Migration 008: Authentication — OTP codes and JWT refresh tokens
-- Depends on: 001_core_fields.sql

-- ─── OTP Codes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS otp_codes (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20)  NOT NULL,
  code         VARCHAR(6)   NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ  NOT NULL,
  used_at      TIMESTAMPTZ,           -- NULL = not yet consumed
  attempts     SMALLINT     NOT NULL DEFAULT 0
);

-- Index for lookup by phone + unused + not expired
CREATE INDEX IF NOT EXISTS idx_otp_phone_valid
  ON otp_codes(phone_number, used_at, expires_at);

-- Auto-purge expired OTPs older than 1 hour (via pg_cron in production;
-- the migration runner leaves a comment here for the operator)
-- Operator: run `SELECT cron.schedule('purge-otp', '*/15 * * * *', 'DELETE FROM otp_codes WHERE expires_at < NOW()');`

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id    UUID         NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  token_hash   VARCHAR(64)  NOT NULL UNIQUE, -- SHA-256 of the raw token
  issued_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ  NOT NULL,
  revoked_at   TIMESTAMPTZ,                  -- NULL = still valid
  user_agent   TEXT,
  ip_address   INET
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_farmer ON refresh_tokens(farmer_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash   ON refresh_tokens(token_hash);

-- ─── Auth Audit Log ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id    UUID         REFERENCES farmers(id) ON DELETE SET NULL,
  phone_number VARCHAR(20),
  event_type   VARCHAR(30)  NOT NULL CHECK (event_type IN (
    'otp_requested', 'otp_verified', 'otp_failed',
    'token_issued', 'token_refreshed', 'token_revoked', 'logout'
  )),
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_farmer ON auth_audit_log(farmer_id, created_at DESC);
