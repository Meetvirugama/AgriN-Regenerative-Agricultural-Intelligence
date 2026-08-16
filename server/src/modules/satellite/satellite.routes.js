import { Router } from "express";
import { satelliteStore } from "./satellite.store.js";
import { satelliteService } from "./satellite.service.js";

const router = Router();

// GET /api/fields/:fieldId/satellite/latest
router.get("/fields/:fieldId/satellite/latest", async (req, res) => {
  const fieldId = req.params.fieldId;
  const latestTile = await satelliteStore.getLatestTile(fieldId);
  const latestTrend = await satelliteStore.getLatestTrend(fieldId);
  const activeAnomalies = await satelliteStore.getActiveAnomalies(fieldId);

  res.json({
    latestTile,
    trend: latestTrend,
    activeAnomalies,
  });
});

// GET /api/fields/:fieldId/satellite/timeline
router.get("/fields/:fieldId/satellite/timeline", async (req, res) => {
  const fieldId = req.params.fieldId;
  const timeline = await satelliteStore.getTrendsTime_series(fieldId);
  res.json({ timeline });
});

// GET /api/fields/:fieldId/satellite/anomalies
router.get("/fields/:fieldId/satellite/anomalies", async (req, res) => {
  const fieldId = req.params.fieldId;
  const anomalies = await satelliteStore.getAllAnomalies(fieldId);
  res.json({ anomalies });
});

// POST /api/satellite/ingest
router.post("/satellite/ingest", async (req, res) => {
  const { fieldId, boundary } = req.body;
  if (!fieldId) {
    return res.status(400).json({ error: "fieldId is required" });
  }

  // boundary could be null in this mock, we just pass what we get
  await satelliteService.ingestLatestForField(
    fieldId,
    boundary || { type: "Polygon", coordinates: [] },
  );
  res.json({ success: true, message: "Ingestion triggered" });
});

export default router;
