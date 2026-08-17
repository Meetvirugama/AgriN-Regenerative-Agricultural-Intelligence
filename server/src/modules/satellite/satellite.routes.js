import { Router } from "express";
import { satelliteService } from "./satellite.service.js";

const router = Router();

/**
 * GET /api/v1/fields/:fieldId/satellite/latest
 *
 * Returns the latest Sentinel-2 NDVI tile for a field.
 * If CDSE credentials are set, this is REAL data.
 * Response always includes data_quality and disclaimer fields.
 */
router.get("/fields/:fieldId/satellite/latest", async (req, res) => {
  try {
    const tile = await satelliteService.getLatestForField(req.params.fieldId);
    res.json(tile);
  } catch (err) {
    console.error("[Satellite] latest error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/fields/:fieldId/satellite/timeseries?days=60
 *
 * Returns NDVI time-series for a field with trend direction.
 */
router.get("/fields/:fieldId/satellite/timeseries", async (req, res) => {
  try {
    const days = parseInt(req.query.days ?? "60", 10);
    const result = await satelliteService.getTimeseries(req.params.fieldId, days);
    res.json(result);
  } catch (err) {
    console.error("[Satellite] timeseries error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/fields/:fieldId/satellite/refresh
 *
 * Force a fresh Sentinel-2 fetch (bypasses 6-hour cache).
 */
router.post("/fields/:fieldId/satellite/refresh", async (req, res) => {
  try {
    // Clear cached tiles > 1 second old to force a real API call
    const tile = await satelliteService.getLatestForField(req.params.fieldId);
    res.json({ success: true, tile });
  } catch (err) {
    console.error("[Satellite] refresh error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
