-- AgriMesh Migration 001: Core domain — farmers and fields
-- Run order: first

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Farmers ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farmers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number        VARCHAR(20)  NOT NULL UNIQUE,
  name                VARCHAR(255) NOT NULL,
  preferred_language  VARCHAR(10)  NOT NULL DEFAULT 'en',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Fields ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fields (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id      UUID         NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  crop_type      VARCHAR(100) NOT NULL,
  crop_variety   VARCHAR(100),
  sowing_date    DATE         NOT NULL,
  lat            FLOAT,
  lng            FLOAT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fields_farmer_id ON fields(farmer_id);

-- ─── Crop Calendars ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crop_calendars (
  id         VARCHAR(100) PRIMARY KEY,
  crop_type  VARCHAR(100) NOT NULL,
  region     VARCHAR(100) NOT NULL,
  stages     JSONB        NOT NULL,  -- array of {stage, gdd_threshold, typical_days}
  UNIQUE(crop_type, region)
);

-- ─── Field Crop States ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS field_crop_states (
  field_id           UUID         PRIMARY KEY REFERENCES fields(id) ON DELETE CASCADE,
  confirmed_crop     VARCHAR(100) NOT NULL,
  confirmed_variety  VARCHAR(100),
  current_stage      VARCHAR(50)  NOT NULL CHECK (current_stage IN ('germination','vegetative','flowering','maturity')),
  stage_description  TEXT         NOT NULL,
  stage_confidence   VARCHAR(20)  NOT NULL CHECK (stage_confidence IN ('high','moderate','low','unknown')),
  stage_conflict     BOOLEAN      NOT NULL DEFAULT FALSE,
  accumulated_gdd    NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_updated_from  VARCHAR(50)  NOT NULL CHECK (last_updated_from IN ('calendar_estimate','satellite_phenology','farmer_override')),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Override Events ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS override_events (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id        UUID         NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  previous_crop   VARCHAR(100),
  new_crop        VARCHAR(100) NOT NULL,
  previous_stage  VARCHAR(50),
  new_stage       VARCHAR(50)  NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_override_events_field_id ON override_events(field_id);

-- ─── Seed: Crop Calendars ─────────────────────────────────────────────────────

INSERT INTO crop_calendars (id, crop_type, region, stages) VALUES
  ('wheat_punjab', 'wheat', 'punjab', '[
    {"stage":"germination","gdd_threshold":0,"typical_days":[0,7]},
    {"stage":"vegetative","gdd_threshold":150,"typical_days":[8,60]},
    {"stage":"flowering","gdd_threshold":600,"typical_days":[61,90]},
    {"stage":"maturity","gdd_threshold":1200,"typical_days":[91,140]}
  ]'),
  ('rice_punjab', 'rice', 'punjab', '[
    {"stage":"germination","gdd_threshold":0,"typical_days":[0,10]},
    {"stage":"vegetative","gdd_threshold":200,"typical_days":[11,70]},
    {"stage":"flowering","gdd_threshold":800,"typical_days":[71,100]},
    {"stage":"maturity","gdd_threshold":1500,"typical_days":[101,150]}
  ]'),
  ('maize_punjab', 'maize', 'punjab', '[
    {"stage":"germination","gdd_threshold":0,"typical_days":[0,8]},
    {"stage":"vegetative","gdd_threshold":180,"typical_days":[9,50]},
    {"stage":"flowering","gdd_threshold":700,"typical_days":[51,80]},
    {"stage":"maturity","gdd_threshold":1300,"typical_days":[81,120]}
  ]'),
  ('cotton_punjab', 'cotton', 'punjab', '[
    {"stage":"germination","gdd_threshold":0,"typical_days":[0,10]},
    {"stage":"vegetative","gdd_threshold":250,"typical_days":[11,60]},
    {"stage":"flowering","gdd_threshold":900,"typical_days":[61,100]},
    {"stage":"maturity","gdd_threshold":1800,"typical_days":[101,160]}
  ]')
ON CONFLICT (id) DO NOTHING;
