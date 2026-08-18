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
    const { image, image2, image3, latitude, longitude, farmerObservations } = req.body;

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

    // Parse extra images
    let imageBuffer2 = null;
    let mimeType2 = "image/jpeg";
    if (image2) {
      const m2 = image2.match(/^data:(image\/\w+);base64,/);
      mimeType2 = m2 ? m2[1] : "image/jpeg";
      const b2 = image2.replace(/^data:image\/\w+;base64,/, "");
      if (b2 && b2.length > 100) imageBuffer2 = Buffer.from(b2, "base64");
    }
    let imageBuffer3 = null;
    let mimeType3 = "image/jpeg";
    if (image3) {
      const m3 = image3.match(/^data:(image\/\w+);base64,/);
      mimeType3 = m3 ? m3[1] : "image/jpeg";
      const b3 = image3.replace(/^data:image\/\w+;base64,/, "");
      if (b3 && b3.length > 100) imageBuffer3 = Buffer.from(b3, "base64");
    }

    const observation = await observationService.diagnoseWithVision(
      fieldId,
      imageBuffer,
      mimeType,
      {
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        imageBuffer2,
        mimeType2,
        imageBuffer3,
        mimeType3,
        farmerObservations: farmerObservations ?? null,
      },
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
