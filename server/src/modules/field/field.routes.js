import { Router } from "express";
import { z } from "zod";
import { layer1Service, STUB_FARMER_ID } from "./field.service.js";
import { requireAuth, optionalAuth } from "../../middleware/auth.js";
import { validate, validateUuidParam } from "../../middleware/validate.js";

const router = Router();

// ─── Input Validation Schemas ────────────────────────────────────────────────
const CreateFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").max(100, "Field name too long").trim(),
  cropType: z.string().min(1, "Crop type is required").max(50).trim(),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sowingDate must be in YYYY-MM-DD format"),
  cropVariety: z.string().max(50).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  locationName: z.string().max(255).optional().nullable(),
  areaHectares: z.union([z.number(), z.string()]).optional().nullable(),
  boundaryGeojson: z.any().optional().nullable(),
  irrigationType: z.string().max(50).optional().nullable(),
});

const UpdateFieldSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  cropType: z.string().min(1).max(50).trim().optional(),
  cropVariety: z.string().max(50).optional().nullable(),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  irrigationType: z.string().max(50).optional().nullable(),
});

// ─── Helper: fire-and-forget weather pre-fetch ─────────────────────────────
async function triggerWeatherPrefetch(fieldId) {
  try {
    const { layer3Service } = await import("../weather/weather.service.js");
    await layer3Service.fetchAndStoreForecast(fieldId);
  } catch (err) {
    console.warn(`[Weather] Pre-fetch failed for field ${fieldId} (non-fatal):`, err.message);
  }
}

// GET /api/v1/fields — optionalAuth: authenticated farmers see only their fields
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub || STUB_FARMER_ID;
    if (!req.farmer) {
      await layer1Service.getOrCreateMockFarmer();
    }
    const fields = await layer1Service.getAllFieldsForFarmer(farmerId);
    res.json(fields);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/fields/:fieldId — with UUID validation and optional ownership check
router.get("/:fieldId", validateUuidParam("fieldId"), optionalAuth, async (req, res, next) => {
  try {
    const field = await layer1Service.getField(req.params.fieldId);
    if (!field) {
      return res.status(404).json({ error: { message: "Field not found", status: 404 } });
    }

    // Ownership check if authenticated
    if (req.farmer?.sub && field.farmer_id !== req.farmer.sub && field.farmer_id !== STUB_FARMER_ID) {
      return res.status(403).json({ error: { message: "Access forbidden", status: 403 } });
    }

    res.json(field);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/fields — validated creation
router.post("/", optionalAuth, validate({ body: CreateFieldSchema }), async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub || STUB_FARMER_ID;
    if (!req.farmer) await layer1Service.getOrCreateMockFarmer();

    const {
      name,
      cropType,
      sowingDate,
      cropVariety,
      lat,
      lng,
      locationName,
      areaHectares,
      boundaryGeojson,
      irrigationType,
    } = req.body;

    const field = await layer1Service.registerField(
      farmerId,
      name,
      cropType,
      sowingDate,
      cropVariety,
      lat,
      lng,
      locationName,
      areaHectares ? parseFloat(areaHectares) : null,
      boundaryGeojson,
      irrigationType,
    );

    // Kick off weather pre-fetch in background
    setImmediate(() => triggerWeatherPrefetch(field.id));

    res.status(201).json(field);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/fields/:fieldId — validated update with ownership check
router.put(
  "/:fieldId",
  requireAuth,
  validateUuidParam("fieldId"),
  validate({ body: UpdateFieldSchema }),
  async (req, res, next) => {
    try {
      const { fieldId } = req.params;
      const existing = await layer1Service.getField(fieldId);
      if (!existing) {
        return res.status(404).json({ error: { message: "Field not found", status: 404 } });
      }

      // Ownership check
      if (req.farmer?.sub && existing.farmer_id !== req.farmer.sub && existing.farmer_id !== STUB_FARMER_ID) {
        return res.status(403).json({ error: { message: "Access forbidden", status: 403 } });
      }

      const { name, cropType, cropVariety, sowingDate, irrigationType } = req.body;
      const updated = await layer1Service.updateField(fieldId, {
        name,
        cropType,
        cropVariety,
        sowingDate,
        irrigationType,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/fields/:fieldId — validated deletion with ownership check
router.delete("/:fieldId", requireAuth, validateUuidParam("fieldId"), async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const existing = await layer1Service.getField(fieldId);
    if (!existing) {
      return res.status(404).json({ error: { message: "Field not found", status: 404 } });
    }

    // Ownership check
    if (req.farmer?.sub && existing.farmer_id !== req.farmer.sub && existing.farmer_id !== STUB_FARMER_ID) {
      return res.status(403).json({ error: { message: "Access forbidden", status: 403 } });
    }

    await layer1Service.deleteField(fieldId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export const fieldRoutes = router;
