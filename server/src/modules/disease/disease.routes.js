import { Router } from "express";
import { observationService } from "./disease.service.js";

const router = Router();

/**
 * POST /api/v1/fields/:fieldId/diagnose
 *
 * Accepts a base64-encoded image (data URL or raw base64).
 * Optionally accepts { crop_type, crop_stage, latitude, longitude } in body.
 *
 * Returns a full structured diagnosis with:
 *   condition_name | condition_category | confidence | severity
 *   differential_diagnosis | evidence | treatment_recommendation
 */
router.post("/:fieldId/diagnose", async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { image, latitude, longitude } = req.body;

    if (!image) {
      return res.status(400).json({ error: "image is required (base64 data URL)" });
    }

    // Strip data URL prefix and get mime type
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    if (!base64Data || base64Data.length < 100) {
      return res.status(400).json({ error: "image data is empty or too short" });
    }

    const imageBuffer = Buffer.from(base64Data, "base64");

    const observation = await observationService.diagnoseWithVision(
      fieldId,
      imageBuffer,
      mimeType,
      { latitude: latitude ?? null, longitude: longitude ?? null },
    );

    res.json(observation);
  } catch (err) {
    console.error("[Diagnosis] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/fields/:fieldId/observations
 * Returns all diagnosis observations for a field, newest first.
 */
router.get("/:fieldId/observations", async (req, res) => {
  try {
    const { fieldId } = req.params;
    const limit = parseInt(req.query.limit ?? "20", 10);
    const history = await observationService.getObservations(fieldId, limit);
    res.json({ observations: history, count: history.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/fields/:fieldId/diagnoses   (legacy alias)
 */
router.get("/:fieldId/diagnoses", async (req, res) => {
  try {
    const history = await observationService.getObservations(req.params.fieldId);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/fields/:fieldId/observations/:obsId
 * Update an observation with farmer feedback (Layer 08 / Section 38)
 */
router.put("/:fieldId/observations/:obsId", async (req, res) => {
  try {
    const { fieldId, obsId } = req.params;
    const { outcome, outcome_notes } = req.body;
    
    if (!outcome) {
      return res.status(400).json({ error: "outcome is required (improved, worsened, unchanged, not_sure)" });
    }

    const updated = await observationService.updateObservationOutcome(
      obsId, 
      fieldId, 
      outcome, 
      outcome_notes || null
    );
    
    if (!updated) {
      return res.status(404).json({ error: "Observation not found" });
    }
    
    res.json({ success: true, observation: updated });
  } catch (err) {
    console.error("[Diagnosis] Error updating outcome:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
