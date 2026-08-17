import { Router } from "express";
import { soilService } from "../soil/soil.service.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/v1/fields/:fieldId/soil
 *
 * Returns the best available soil profile for a field.
 * Priority: lab_report > soilgrids > regional_inference
 * Response always includes `source` and `confidence` fields.
 */
router.get("/:fieldId/soil", async (req, res) => {
  try {
    const profile = await soilService.getActiveSoilProfile(req.params.fieldId);
    if (!profile) {
      return res.status(404).json({
        error: "No soil data available.",
        suggestion: "Add a field boundary so SoilGrids data can be fetched automatically.",
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/fields/:fieldId/soil/parse
 *
 * Upload a soil lab report image/PDF for Gemini Vision parsing.
 */
router.post("/:fieldId/soil/parse", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Document file is required" });
    }
    const parsedData = await soilService.parseAndSaveLabReport(
      req.params.fieldId,
      req.file.buffer,
    );
    res.json(parsedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/fields/:fieldId/soil/save
 *
 * Save a reviewed soil profile (after farmer confirms parsed lab report).
 */
router.post("/:fieldId/soil/save", async (req, res) => {
  try {
    const profile = await soilService.saveReviewedProfile(req.params.fieldId, req.body);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
