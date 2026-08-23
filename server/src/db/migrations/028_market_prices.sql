-- AgriMesh Migration 028: Market Prices
-- Three normalized tables for mandi price data from data.gov.in

-- ─── Commodities ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commodities (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) UNIQUE NOT NULL
);

-- ─── Markets ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS markets (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(150) NOT NULL,
    district  VARCHAR(100),
    state     VARCHAR(100),
    latitude  DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    UNIQUE(name, district, state)
);

-- ─── Market Prices (daily time-series) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS market_prices (
    id                BIGSERIAL PRIMARY KEY,
    commodity_id      INT REFERENCES commodities(id) ON DELETE CASCADE,
    market_id         INT REFERENCES markets(id) ON DELETE CASCADE,
    price_date        DATE NOT NULL,
    variety           VARCHAR(150) DEFAULT 'Other',
    grade             VARCHAR(100) DEFAULT 'FAQ',
    min_price         NUMERIC(10,2),
    max_price         NUMERIC(10,2),
    modal_price       NUMERIC(10,2),
    arrival_quantity  NUMERIC,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(commodity_id, market_id, price_date, variety, grade)
);

-- ─── Indexes for common query patterns ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON market_prices(commodity_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(price_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity_date ON market_prices(commodity_id, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_markets_state_district ON markets(state, district);
