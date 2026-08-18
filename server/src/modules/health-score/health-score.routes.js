import { Router } from "express";
import { healthScoreService } from "./health-score.service.js";

const router = Router();

/**
 * GET /api/v1/fields/:fieldId/health
 *
 * Returns a deterministic field health score (0–100) with full evidence trail.
 * Computed from: NDVI (40%) + Weather risk (30%) + Soil quality (20%) + Crop stage (10%)
 * AI is NOT involved in this computation — Gemini only reasons over these results.
 */
router.get("/fields/:fieldId/health", async (req, res) => {
  try {
    const score = await healthScoreService.computeScore(req.params.fieldId);
    res.json(score);
  } catch (err) {
    console.error("[Health] computeScore error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Legacy alias — keep working for existing frontend
router.get("/fields/:fieldId/health-score", async (req, res) => {
  try {
    const score = await healthScoreService.computeScore(req.params.fieldId);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
