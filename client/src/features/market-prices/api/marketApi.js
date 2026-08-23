import { request } from "../../../services/apiClient";

/**
 * Market Prices API Client
 *
 * Provides functions to interact with the market prices backend endpoints.
 * Uses the shared request() helper for consistent auth and error handling.
 */

export const marketApi = {
  /**
   * Search current prices for a commodity.
   * @param {string} commodity - Crop name (e.g. "Tomato")
   * @param {string} [state] - State filter
   * @param {string} [district] - District filter
   */
  searchPrices: async (commodity, state, district) => {
    const params = new URLSearchParams({ commodity });
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    return request(`/market/prices?${params.toString()}`);
  },

  /**
   * Get historical price data for charting.
   * @param {string} commodity - Crop name
   * @param {string} market - Market name
   * @param {number} [days=30] - Number of days of history
   */
  getPriceHistory: async (commodity, market, days = 30) => {
    const params = new URLSearchParams({ commodity, market, days: String(days) });
    return request(`/market/prices/history?${params.toString()}`);
  },

  /**
   * Get prices from nearby markets (same state).
   */
  getNearbyMarkets: async (commodity, state, district) => {
    const params = new URLSearchParams({ commodity, state });
    if (district) params.set("district", district);
    return request(`/market/nearby?${params.toString()}`);
  },

  /**
   * List all available commodities for the dropdown.
   */
  getCommodities: async () => {
    return request("/market/commodities");
  },

  /**
   * List all states (optionally filtered by commodity).
   */
  getStates: async (commodity) => {
    const params = new URLSearchParams();
    if (commodity) params.set("commodity", commodity);
    return request(`/market/states?${params.toString()}`);
  },

  /**
   * List districts for a given state (optionally filtered by commodity).
   */
  getDistricts: async (state, commodity) => {
    const params = new URLSearchParams({ state });
    if (commodity) params.set("commodity", commodity);
    return request(`/market/districts?${params.toString()}`);
  },

  /**
   * Get prices for the farmer's own crops (personalized).
   */
  getMyCropPrices: async () => {
    return request("/market/my-crops");
  },

  /**
   * Get AI Market Insight based on current data.
   */
  getMarketInsight: async (data) => {
    const params = new URLSearchParams();
    if (data.commodity) params.set("commodity", data.commodity);
    if (data.currentPrice) params.set("currentPrice", data.currentPrice);
    if (data.msp) params.set("msp", data.msp);
    if (data.marketName) params.set("marketName", data.marketName);
    if (data.modalPrice) params.set("modalPrice", data.modalPrice);
    if (data.netPrice) params.set("netPrice", data.netPrice);
    if (data.distance) params.set("distance", data.distance);
    
    return request(`/market/insight?${params.toString()}`);
  }
};
