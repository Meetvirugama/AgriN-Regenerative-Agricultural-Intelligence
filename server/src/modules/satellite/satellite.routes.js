import { Router } from "express";
import { satelliteService } from "./satellite.service.js";
import { PythonClient } from "../../services/pythonClient.js";

const router = Router();

/**
 * GET /api/v1/fields/:fieldId/satellite/latest
 *
 * Returns the latest Sentinel-2 NDVI tile for a field.
 * If CDSE credentials are set, this is REAL data.
 * Response always includes data_quality and disclaimer fields.
 */
router.get("/fields/:fieldId/satellite/latest", async (req, res, next) => {
  try {
    const fieldId = req.params.fieldId;
    const tile = await satelliteService.getLatestForField(fieldId);
    const timeseries = await satelliteService.getTimeseries(fieldId, 60);
    
    // Call Python AI to process anomalies
    const enriched = await PythonClient.processSatelliteData(
      fieldId,
      tile,
      timeseries.observations
    );
    
    res.json(enriched);
  } catch (err) {
    console.error("[Satellite] latest error:", err.message);
    next(err);
  }
});

/**
 * GET /api/v1/fields/:fieldId/satellite/timeseries?days=60
 *
 * Returns NDVI time-series for a field with trend direction.
 */
router.get("/fields/:fieldId/satellite/timeseries", async (req, res, next) => {
  try {
    const days = parseInt(req.query.days ?? "60", 10);
    const result = await satelliteService.getTimeseries(req.params.fieldId, days);
    res.json(result);
  } catch (err) {
    console.error("[Satellite] timeseries error:", err.message);
    next(err);
  }
});

/**
 * POST /api/v1/fields/:fieldId/satellite/refresh
 *
 * Force a fresh Sentinel-2 fetch (bypasses 6-day cache via forceRefresh=true).
 */
router.post("/fields/:fieldId/satellite/refresh", async (req, res, next) => {
  try {
    // forceRefresh=true bypasses the 6-day cache so a real API call is made
    const tile = await satelliteService.getLatestForField(req.params.fieldId, true);
    res.json({ success: true, tile });
  } catch (err) {
    console.error("[Satellite] refresh error:", err.message);
    next(err);
  }
});

export default router;
