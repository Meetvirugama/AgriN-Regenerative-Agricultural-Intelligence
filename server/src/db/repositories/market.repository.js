import { query, queryOne, execute } from "../connection.js";

/**
 * Market Price Repository
 *
 * Data-access layer for commodities, markets, and market_prices tables.
 * All writes use UPSERT (ON CONFLICT) for idempotent ingestion.
 */

// ─── Commodity Operations ────────────────────────────────────────────────────

/**
 * Insert a commodity or return existing id.
 */
export async function upsertCommodity(name) {
  const row = await queryOne(
    `INSERT INTO commodities (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name.trim()]
  );
  return row.id;
}

/**
 * List all known commodities (for dropdown).
 */
export async function listCommodities() {
  return query(
    `SELECT id, name FROM commodities ORDER BY name`
  );
}

// ─── Market Operations ──────────────────────────────────────────────────────

/**
 * Insert a market or return existing id.
 */
export async function upsertMarket(name, district, state) {
  const row = await queryOne(
    `INSERT INTO markets (name, district, state)
     VALUES ($1, $2, $3)
     ON CONFLICT (name, district, state) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name.trim(), district?.trim() || null, state?.trim() || null]
  );
  return row.id;
}

/**
 * List all distinct states that have markets (optionally filtered by commodity).
 */
export async function listStates(commodity) {
  if (commodity) {
    return query(
      `SELECT DISTINCT m.state FROM markets m
       JOIN market_prices mp ON m.id = mp.market_id
       JOIN commodities c ON c.id = mp.commodity_id
       WHERE m.state IS NOT NULL AND LOWER(c.name) = LOWER($1)
       ORDER BY m.state`,
      [commodity]
    );
  }
  return query(
    `SELECT DISTINCT state FROM markets WHERE state IS NOT NULL ORDER BY state`
  );
}

/**
 * List all distinct districts for a given state (optionally filtered by commodity).
 */
export async function listDistricts(state, commodity) {
  if (commodity) {
    return query(
      `SELECT DISTINCT m.district FROM markets m
       JOIN market_prices mp ON m.id = mp.market_id
       JOIN commodities c ON c.id = mp.commodity_id
       WHERE m.state = $1 AND m.district IS NOT NULL AND LOWER(c.name) = LOWER($2)
       ORDER BY m.district`,
      [state, commodity]
    );
  }
  return query(
    `SELECT DISTINCT district FROM markets WHERE state = $1 AND district IS NOT NULL ORDER BY district`,
    [state]
  );
}

// ─── Price Operations ───────────────────────────────────────────────────────

/**
 * Upsert a price record. Safe to call with duplicate data.
 */
export async function upsertPrice({
  commodityId,
  marketId,
  priceDate,
  variety,
  grade,
  minPrice,
  maxPrice,
  modalPrice,
  arrivalQuantity,
}) {
  await execute(
    `INSERT INTO market_prices
       (commodity_id, market_id, price_date, variety, grade, min_price, max_price, modal_price, arrival_quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (commodity_id, market_id, price_date, variety, grade)
     DO UPDATE SET
       min_price = EXCLUDED.min_price,
       max_price = EXCLUDED.max_price,
       modal_price = EXCLUDED.modal_price,
       arrival_quantity = EXCLUDED.arrival_quantity`,
    [
      commodityId,
      marketId,
      priceDate,
      variety || "Other",
      grade || "FAQ",
      minPrice,
      maxPrice,
      modalPrice,
      arrivalQuantity,
    ]
  );
}

/**
 * Search current (latest-date) prices for a commodity, optionally filtered by state/district.
 */
export async function searchPrices({ commodity, state, district, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  conditions.push(`LOWER(c.name) = LOWER($${idx})`);
  params.push(commodity);
  idx++;

  if (state) {
    conditions.push(`LOWER(m.state) = LOWER($${idx})`);
    params.push(state);
    idx++;
  }

  if (district) {
    conditions.push(`LOWER(m.district) = LOWER($${idx})`);
    params.push(district);
    idx++;
  }

  params.push(limit);

  return query(
    `SELECT
       mp.price_date,
       mp.min_price,
       mp.max_price,
       mp.modal_price,
       mp.variety,
       mp.grade,
       mp.arrival_quantity,
       c.name AS commodity,
       m.name AS market,
       m.district,
       m.state
     FROM market_prices mp
     JOIN commodities c ON c.id = mp.commodity_id
     JOIN markets m ON m.id = mp.market_id
     WHERE ${conditions.join(" AND ")}
       AND mp.price_date = (
         SELECT MAX(mp2.price_date)
         FROM market_prices mp2
         JOIN commodities c2 ON c2.id = mp2.commodity_id
         WHERE LOWER(c2.name) = LOWER($1)
       )
     ORDER BY mp.modal_price ASC
     LIMIT $${idx}`,
    params
  );
}

/**
 * Get historical prices for a commodity at a specific market.
 */
export async function getPriceHistory({ commodity, market, days = 30 }) {
  return query(
    `SELECT
       mp.price_date,
       mp.min_price,
       mp.max_price,
       mp.modal_price,
       mp.arrival_quantity
     FROM market_prices mp
     JOIN commodities c ON c.id = mp.commodity_id
     JOIN markets m ON m.id = mp.market_id
     WHERE LOWER(c.name) = LOWER($1)
       AND LOWER(m.name) = LOWER($2)
       AND mp.price_date >= CURRENT_DATE - INTERVAL '1 day' * $3
     ORDER BY mp.price_date ASC`,
    [commodity, market, days]
  );
}

/**
 * Get nearby markets (same state) with latest prices for a commodity.
 */
export async function getNearbyMarkets({ commodity, state, excludeMarket, limit = 10 }) {
  const conditions = [
    `LOWER(c.name) = LOWER($1)`,
    `LOWER(m.state) = LOWER($2)`,
  ];
  const params = [commodity, state];
  let idx = 3;

  if (excludeMarket) {
    conditions.push(`LOWER(m.name) != LOWER($${idx})`);
    params.push(excludeMarket);
    idx++;
  }

  params.push(limit);

  return query(
    `SELECT DISTINCT ON (m.name)
       m.name AS market,
       m.district,
       mp.modal_price,
       mp.price_date
     FROM market_prices mp
     JOIN commodities c ON c.id = mp.commodity_id
     JOIN markets m ON m.id = mp.market_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY m.name, mp.price_date DESC
     LIMIT $${idx}`,
    params
  );
}

/**
 * Get latest prices for a list of crop names (for "Your Crops" section).
 */
export async function getLatestPricesForCrops(cropNames) {
  if (!cropNames || cropNames.length === 0) return [];

  // Build a parameterized IN clause
  const placeholders = cropNames.map((_, i) => `LOWER($${i + 1})`).join(", ");

  return query(
    `SELECT DISTINCT ON (c.name)
       c.name AS commodity,
       mp.modal_price,
       mp.min_price,
       mp.max_price,
       mp.price_date,
       m.name AS market,
       m.state
     FROM market_prices mp
     JOIN commodities c ON c.id = mp.commodity_id
     JOIN markets m ON m.id = mp.market_id
     WHERE LOWER(c.name) IN (${placeholders})
     ORDER BY c.name, mp.price_date DESC`,
    cropNames.map((n) => n.toLowerCase())
  );
}
