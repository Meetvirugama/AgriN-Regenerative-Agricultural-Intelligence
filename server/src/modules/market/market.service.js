import * as marketRepo from "../../db/repositories/market.repository.js";
import { query } from "../../db/connection.js";

/**
 * Market Price Service
 *
 * Business logic for market prices — adds % change calculations,
 * formats responses, and handles the "Your Crops" personalization.
 */

/**
 * Get current price with % change from previous available date.
 */
export async function getCurrentPrice(commodity, state, district) {
  const prices = await marketRepo.searchPrices({ commodity, state, district, limit: 50 });

  if (prices.length === 0) {
    return { prices: [], previousPrice: null, change: null };
  }

  // Calculate % change: get the most recent modal price vs the day before
  const latestDate = prices[0].price_date;
  const latestModal = parseFloat(prices[0].modal_price);

  // Get the previous day's price for the same commodity + first market
  const prevRows = await marketRepo.getPriceHistory({
    commodity,
    market: prices[0].market,
    days: 14,
  });

  let change = null;
  let previousPrice = null;

  if (prevRows.length >= 2) {
    // The last entry in prevRows (sorted ASC) is today, second-to-last is previous
    const prevEntry = prevRows[prevRows.length - 2];
    previousPrice = parseFloat(prevEntry.modal_price);
    if (previousPrice > 0) {
      change = ((latestModal - previousPrice) / previousPrice) * 100;
    }
  }

  return {
    prices,
    latestDate,
    previousPrice,
    change: change !== null ? Math.round(change * 10) / 10 : null,
  };
}

/**
 * Get price history formatted for chart rendering.
 */
export async function getPriceHistory(commodity, market, days = 30) {
  const rows = await marketRepo.getPriceHistory({ commodity, market, days });

  return {
    commodity,
    market,
    days,
    prices: rows.map((r) => ({
      date: r.price_date,
      minPrice: parseFloat(r.min_price),
      maxPrice: parseFloat(r.max_price),
      modalPrice: parseFloat(r.modal_price),
      arrivalQuantity: r.arrival_quantity ? parseFloat(r.arrival_quantity) : null,
    })),
  };
}

/**
 * Get nearby markets with latest prices.
 */
export async function getNearbyMarketPrices(commodity, state, district) {
  const rows = await marketRepo.getNearbyMarkets({
    commodity,
    state,
    excludeMarket: null,
    limit: 15,
  });

  return rows.map((r) => ({
    market: r.market,
    district: r.district,
    modalPrice: parseFloat(r.modal_price),
    priceDate: r.price_date,
  }));
}

/**
 * Get prices for the farmer's own crops (from their fields).
 */
export async function getCropPricesForFarmer(farmerId) {
  // Get the farmer's crop types from their fields
  const fields = await query(
    `SELECT DISTINCT crop_type FROM fields WHERE farmer_id = $1`,
    [farmerId]
  );

  if (fields.length === 0) return [];

  const cropNames = fields.map((f) => f.crop_type);
  const prices = await marketRepo.getLatestPricesForCrops(cropNames);

  // For each crop, try to compute % change
  const results = [];
  for (const price of prices) {
    const history = await marketRepo.getPriceHistory({
      commodity: price.commodity,
      market: price.market,
      days: 7,
    });

    let change = null;
    if (history.length >= 2) {
      const latest = parseFloat(history[history.length - 1].modal_price);
      const prev = parseFloat(history[history.length - 2].modal_price);
      if (prev > 0) {
        change = Math.round(((latest - prev) / prev) * 100 * 10) / 10;
      }
    }

    results.push({
      commodity: price.commodity,
      modalPrice: parseFloat(price.modal_price),
      minPrice: parseFloat(price.min_price),
      maxPrice: parseFloat(price.max_price),
      priceDate: price.price_date,
      market: price.market,
      state: price.state,
      change,
    });
  }

  return results;
}

/**
 * List all commodities.
 */
export async function listCommodities() {
  return marketRepo.listCommodities();
}

/**
 * List all states.
 */
export async function listStates(commodity) {
  return marketRepo.listStates(commodity);
}

/**
 * List districts for a state.
 */
export async function listDistricts(state, commodity) {
  return marketRepo.listDistricts(state, commodity);
}
