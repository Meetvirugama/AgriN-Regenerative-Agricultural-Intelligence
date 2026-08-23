import fetch from "node-fetch";
import { query } from "../../db/connection.js";

/**
 * Market Price Service (Live API Integration)
 *
 * Fetches market prices live from the data.gov.in Open Government Data API.
 */

const RESOURCE_ID = process.env.DATA_GOV_RESOURCE_ID || "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// Static fallbacks for dropdowns since we bypassed the DB
const COMMON_COMMODITIES = [
  "Tomato", "Potato", "Onion", "Wheat", "Rice", "Cotton", 
  "Maize", "Soyabean", "Gram", "Groundnut", "Mustard"
].map(name => ({ name }));

const COMMON_STATES = [
  "Gujarat", "Maharashtra", "Punjab", "Haryana", 
  "Karnataka", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan"
].map(state => ({ state }));

// Mock MSP for 2023/24 (in ₹/quintal)
const STATIC_MSP = {
  "Wheat": 2275,
  "Paddy(Dhan)(Common)": 2183,
  "Paddy": 2183,
  "Rice": 2183,
  "Cotton": 6620,
  "Maize": 2090,
  "Soyabean": 4600,
  "Mustard": 5450,
  "Gram": 5440,
  "Groundnut": 6377
};

// Stable pseudo-random number based on string (to mock stable distance/arrivals)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Helper to fetch live from data.gov.in
async function fetchFromDataGov(filters = {}, limit = 50) {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    console.warn("[MarketService] DATA_GOV_API_KEY is not set.");
    return [];
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      url.searchParams.set(`filters[${key}]`, value);
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      timeout: 15000,
    });

    if (!response.ok) {
      console.error(`data.gov.in API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.records || [];
  } catch (error) {
    console.error("[MarketService] Error fetching data:", error.message);
    return [];
  }
}

// Convert API record to our frontend schema
function parseRecord(r) {
  // Convert dd/MM/yyyy to yyyy-MM-dd if needed
  let priceDate = r.arrival_date;
  if (priceDate && priceDate.includes("/")) {
    const parts = priceDate.split("/");
    if (parts.length === 3) {
      priceDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return {
    commodity: r.commodity,
    state: r.state,
    district: r.district,
    market: r.market,
    variety: r.variety,
    grade: r.grade,
    price_date: priceDate,
    priceDate: priceDate, // Camel case for frontend compatibility in some places
    min_price: parseFloat(r.min_price),
    max_price: parseFloat(r.max_price),
    modal_price: parseFloat(r.modal_price),
    arrival_quantity: null
  };
}

/**
 * Get current price
 */
export async function getCurrentPrice(commodity, state, district) {
  const filters = { commodity };
  if (state) filters.state = state;
  if (district) filters.district = district;

  const records = await fetchFromDataGov(filters, 50);
  if (records.length === 0) {
    return { prices: [], previousPrice: null, change: null };
  }

  const prices = records.map(parseRecord);
  const latestDate = prices[0].price_date;

  // Mock arrivals based on market name for consistency
  const mockArrivals = 100 + (hashString(prices[0].market + latestDate) % 2000);

  return {
    prices,
    latestDate,
    previousPrice: null, // Hard to calculate change on the fly without heavy pagination
    change: null,
    msp: STATIC_MSP[commodity] || null,
    arrivals: mockArrivals
  };
}

/**
 * Get price history
 */
export async function getPriceHistory(commodity, market, days = 30) {
  const records = await fetchFromDataGov({ commodity, market }, days);
  
  return {
    commodity,
    market,
    days,
    prices: records.map(parseRecord).map(p => ({
      date: p.price_date,
      minPrice: p.min_price,
      maxPrice: p.max_price,
      modalPrice: p.modal_price,
      arrivalQuantity: p.arrival_quantity
    }))
  };
}

/**
 * Get nearby markets
 */
export async function getNearbyMarketPrices(commodity, state, district) {
  const records = await fetchFromDataGov({ commodity, state }, 15);
  const mapped = records.map(r => {
    const p = parseRecord(r);
    // Mock distance based on market name
    const distance = 5 + (hashString(p.market) % 145); // 5 to 150 km
    const transportCost = Math.round(distance * 1.5); // ₹1.5 per km per quintal
    const netPrice = p.modal_price - transportCost;

    return {
      market: p.market,
      district: p.district,
      modalPrice: p.modal_price,
      priceDate: p.price_date,
      distance,
      transportCost,
      netPrice
    };
  });

  // Sort by net price descending
  return mapped.sort((a, b) => b.netPrice - a.netPrice);
}

/**
 * Get prices for the farmer's own crops
 */
export async function getCropPricesForFarmer(farmerId) {
  // Get the farmer's crop types from their fields
  const fields = await query(
    `SELECT DISTINCT crop_type FROM fields WHERE farmer_id = $1`,
    [farmerId]
  );

  if (fields.length === 0) return [];

  const results = [];
  for (const field of fields) {
    const records = await fetchFromDataGov({ commodity: field.crop_type }, 1);
    if (records.length > 0) {
      const p = parseRecord(records[0]);
      results.push({
        commodity: p.commodity,
        modalPrice: p.modal_price,
        minPrice: p.min_price,
        maxPrice: p.max_price,
        priceDate: p.price_date,
        market: p.market,
        state: p.state,
        change: null
      });
    }
  }

  return results;
}

/**
 * List all commodities (Static Fallback)
 */
export async function listCommodities() {
  return COMMON_COMMODITIES;
}

/**
 * List all states (Static Fallback)
 */
export async function listStates(commodity) {
  return COMMON_STATES;
}

/**
 * List districts for a state (Static Fallback)
 */
export async function listDistricts(state, commodity) {
  // For live API without heavy caching, we return empty district list to allow typing
  // Or a simple mock if required. Returning empty lets the search work with just state.
  return [];
}
