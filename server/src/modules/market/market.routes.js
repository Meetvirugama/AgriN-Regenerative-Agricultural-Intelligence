import { Router } from "express";
import * as marketService from "./market.service.js";
import { generateMarketInsight } from "../intelligence/intelligence.ai.js";

const router = Router();

// ─── Current Prices ──────────────────────────────────────────────────────────
// GET /api/v1/market/prices?commodity=Tomato&state=Gujarat&district=Ahmedabad
router.get("/market/prices", async (req, res, next) => {
  try {
    const { commodity, state, district } = req.query;
    if (!commodity) {
      return res.status(400).json({ error: "commodity query parameter is required" });
    }
    const data = await marketService.getCurrentPrice(commodity, state, district);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Price History ───────────────────────────────────────────────────────────
// GET /api/v1/market/prices/history?commodity=Tomato&market=Ahmedabad&days=30
router.get("/market/prices/history", async (req, res, next) => {
  try {
    const { commodity, market, days } = req.query;
    if (!commodity || !market) {
      return res.status(400).json({ error: "commodity and market query parameters are required" });
    }
    const dayCount = Math.min(parseInt(days ?? "30", 10), 365);
    const data = await marketService.getPriceHistory(commodity, market, dayCount);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Nearby Markets ──────────────────────────────────────────────────────────
// GET /api/v1/market/nearby?commodity=Tomato&state=Gujarat&district=Ahmedabad
router.get("/market/nearby", async (req, res, next) => {
  try {
    const { commodity, state, district } = req.query;
    if (!commodity || !state) {
      return res.status(400).json({ error: "commodity and state query parameters are required" });
    }
    const data = await marketService.getNearbyMarketPrices(commodity, state, district);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Commodities List ────────────────────────────────────────────────────────
// GET /api/v1/market/commodities
router.get("/market/commodities", async (_req, res, next) => {
  try {
    const data = await marketService.listCommodities();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/states
router.get("/market/states", async (req, res, next) => {
  try {
    const { commodity } = req.query;
    const data = await marketService.listStates(commodity);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/districts?state=Gujarat&commodity=Wheat
router.get("/market/districts", async (req, res, next) => {
  try {
    const { state, commodity } = req.query;
    if (!state) {
      return res.status(400).json({ error: "state query parameter is required" });
    }
    const data = await marketService.listDistricts(state, commodity);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── My Crop Prices (personalized) ──────────────────────────────────────────
// GET /api/v1/market/my-crops
router.get("/market/my-crops", async (req, res, next) => {
  try {
    const farmerId = req.farmerId;
    if (!farmerId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const data = await marketService.getCropPricesForFarmer(farmerId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── AI Market Insight ───────────────────────────────────────────────────────
// GET /api/v1/market/insight
router.get("/market/insight", async (req, res, next) => {
  try {
    const { commodity, currentPrice, msp, marketName, modalPrice, netPrice, distance } = req.query;
    
    let bestMarket = null;
    if (marketName && modalPrice) {
      bestMarket = {
        market: marketName,
        modalPrice,
        netPrice,
        distance
      };
    }
    
    const insight = await generateMarketInsight(commodity, currentPrice, bestMarket, msp);
    res.json({ insight });
  } catch (err) {
    next(err);
  }
});

export default router;
