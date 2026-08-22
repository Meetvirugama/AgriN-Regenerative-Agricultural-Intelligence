import { Router } from "express";
import { satelliteService } from "./satellite.service.js";
import { PythonClient } from "../../services/pythonClient.js";

const router = Router();

/**
 * GET /api/v1/fields/:fieldId/satellite-health
 *
 * Frontend-facing aggregated satellite health endpoint.
 * Returns real NDVI tile data. AI enrichment is optional via Python service.
 */
router.get("/fields/:fieldId/satellite-health", async (req, res, next) => {
  try {
    const fieldId = req.params.fieldId;
    const tile = await satelliteService.getLatestForField(fieldId);
    const timeseries = await satelliteService.getTimeseries(fieldId, 60);

    // Attempt AI enrichment via Python service — gracefully degrade if unavailable
    let trend = {};
    let anomaly = null;
    let summary = null;

    try {
      const enriched = await PythonClient.processSatelliteData(
        fieldId,
        tile,
        timeseries.observations
      );
      trend = enriched.trend || {};
      anomaly = enriched.activeAnomalies?.[0] || null;
      summary = enriched.trend?.summaryText || null;
    } catch (aiErr) {
      console.warn(`[Satellite] AI enrichment unavailable (${aiErr.message}). Returning raw tile data.`);
      // Build a basic summary from raw tile data
      trend = { ndviTrendDirection: timeseries.trend || "unavailable" };
      summary = tile.ndvi_mean
        ? `Vegetation index (NDVI) is ${(tile.ndvi_mean * 100).toFixed(0)}. Trend: ${timeseries.trend || "insufficient data"}.`
        : "Satellite observations are available for this field.";
    }

    res.json({
      healthScore: tile?.ndvi_mean ? Math.round(tile.ndvi_mean * 100) : null,
      vegetationTrend: trend.ndviTrendDirection || timeseries.trend || "unavailable",
      moistureTrend: trend.moistureTrend || "unavailable",
      anomaly: anomaly
        ? {
            detected: true,
            severity: anomaly.severity,
            location: anomaly.subregionLabel || "Unknown Area",
            dropPercentage: anomaly.dropPercentage,
          }
        : null,
      observationDate: trend.date || tile?.observation_date || null,
      imageUrl: tile?.tile_url || null,
      summary: summary || "Satellite observations are available for this field.",
      dataSource: tile?.data_source || "unavailable",
      dataQuality: tile?.data_quality || "unavailable",
      disclaimer: tile?.disclaimer || null,
      ndviMean: tile?.ndvi_mean ?? null,
      cloudCoverPct: tile?.cloud_cover_pct ?? null,
      cloudObstructed: tile?.cloud_obstructed ?? false,
    });
  } catch (err) {
    console.error("[Satellite] health error:", err.message);
    next(err);
  }
});

/**
 * GET /api/v1/fields/:fieldId/satellite/latest
 *
 * Returns the latest Sentinel-2 NDVI tile for a field.
 */
router.get("/fields/:fieldId/satellite/latest", async (req, res, next) => {
  try {
    const fieldId = req.params.fieldId;
    const tile = await satelliteService.getLatestForField(fieldId);
    const timeseries = await satelliteService.getTimeseries(fieldId, 60);

    // Attempt AI enrichment — degrade gracefully
    try {
      const enriched = await PythonClient.processSatelliteData(
        fieldId,
        tile,
        timeseries.observations
      );
      res.json(enriched);
    } catch (aiErr) {
      console.warn(`[Satellite] AI enrichment unavailable. Returning raw tile.`);
      res.json({ ...tile, trend: timeseries.trend, observations: timeseries.observations });
    }
  } catch (err) {
    console.error("[Satellite] latest error:", err.message);
    next(err);
  }
});

/**
 * GET /api/v1/fields/:fieldId/satellite/timeseries?days=60
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
 */
router.post("/fields/:fieldId/satellite/refresh", async (req, res, next) => {
  try {
    const tile = await satelliteService.getLatestForField(req.params.fieldId, true);
    res.json({ success: true, tile });
  } catch (err) {
    console.error("[Satellite] refresh error:", err.message);
    next(err);
  }
});

export default router;
