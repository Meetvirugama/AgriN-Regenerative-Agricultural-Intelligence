-- AgriMesh Migration 010: Alerts

CREATE TABLE IF NOT EXISTS alerts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id      UUID         NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  field_id       UUID         REFERENCES fields(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  priority       VARCHAR(50)  NOT NULL,
  type           VARCHAR(50)  NOT NULL,
  resolved       BOOLEAN      NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for querying by farmer
CREATE INDEX IF NOT EXISTS idx_alerts_farmer_id ON alerts(farmer_id);
