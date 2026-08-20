import { Router } from "express";
import { soilService } from "../soil/soil.service.js";
import multer from "multer";

const router = Router();

// Multer config — 10 MB limit, allowlist common document/image types
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic",
  "application/pdf",
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, HEIC, PDF`));
    }
  },
});

/**
 * GET /api/v1/fields/:fieldId/soil
 *
 * Returns the best available soil profile for a field.
 * Priority: lab_report > soilgrids > regional_inference
 * Response always includes `source` and `confidence` fields.
 */
router.get("/:fieldId/soil", async (req, res, next) => {
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
    next(err);
  }
});

/**
 * POST /api/v1/fields/:fieldId/soil/parse
 *
 * Upload a soil lab report image/PDF for Gemini Vision parsing.
 */
router.post("/:fieldId/soil/parse", upload.single("document"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Document file is required" });
    }
    // Pass the real MIME type so Gemini Vision receives the correct content-type
    const parsedData = await soilService.parseAndSaveLabReport(
      req.params.fieldId,
      req.file.buffer,
      req.file.mimetype,
    );
    res.json(parsedData);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/fields/:fieldId/soil/save
 *
 * Save a reviewed soil profile (after farmer confirms parsed lab report).
 */
router.post("/:fieldId/soil/save", async (req, res, next) => {
  try {
    const profile = await soilService.saveReviewedProfile(req.params.fieldId, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
