import { Router } from "express";
import { layer3Service } from "../weather/weather.service.js";
import { validateUuidParam } from "../../middleware/validate.js";

const router = Router();

router.use("/:fieldId", validateUuidParam("fieldId"));

// GET /api/fields/:fieldId/weather/forecast
// Smart cache: serves Postgres data if fresh, otherwise fetches from Open-Meteo
router.get("/:fieldId/weather/forecast", async (req, res, next) => {
  try {
    const data = await layer3Service.getLocalizedForecast(req.params.fieldId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/fields/:fieldId/weather/history?days=30
// Returns historical actuals — fetches from Open-Meteo if not cached
router.get("/:fieldId/weather/history", async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days ?? "14", 10), 30);
    const fieldId = req.params.fieldId;

    // Check Postgres cache first
    const cached = await layer3Service.getCachedHistory(fieldId, days);
    if (cached.length > 0) {
      res.json(cached);
      return;
    }

    // If nothing cached yet, fetch from Open-Meteo API and persist
    const history = await layer3Service.getFieldWeatherHistory(fieldId);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// POST /api/fields/:fieldId/weather/refresh
// Force-refresh — bypasses cache and fetches fresh data from Open-Meteo
router.post("/:fieldId/weather/refresh", async (req, res, next) => {
  try {
    const data = await layer3Service.fetchAndStoreForecast(req.params.fieldId);
    res.json({ message: "Weather data refreshed", ...data });
  } catch (err) {
    next(err);
  }
});

export default router;
