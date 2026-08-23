import { Router } from "express";
import { layer1Service, STUB_FARMER_ID } from "./field.service.js";
import { requireAuth, optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { z } from "zod";

const FieldSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cropType: z.string().min(1, "Crop type is required"),
  sowingDate: z.string().min(1, "Sowing date is required"),
  cropVariety: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  locationName: z.string().optional().nullable(),
  areaHectares: z.number().optional().nullable(),
  boundaryGeojson: z.any().optional().nullable(), // Allow JSON object
  irrigationType: z.string().optional().nullable(),
  soilType: z.string().optional().nullable(),
  previousCrop: z.string().optional().nullable(),
  tillageMethod: z.string().optional().nullable(),
  seedRate: z.string().optional().nullable(),
  targetYield: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const router = Router();

// ─── Helper: fire-and-forget weather pre-fetch ─────────────────────────────
// Imported lazily to avoid circular deps. Errors are intentionally swallowed
// so a weather API outage never blocks field creation.
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
    // req.farmer.sub is set by optionalAuth if a valid token is present
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

// GET /api/v1/fields/:fieldId
router.get("/:fieldId", async (req, res, next) => {
  try {
    const field = await layer1Service.getField(req.params.fieldId);
    if (!field) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }
    res.json(field);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/fields — optionalAuth: creates under authenticated farmer if present
router.post("/", optionalAuth, validate({ body: FieldSchema }), async (req, res, next) => {
  try {
    // Scope to authenticated farmer when token present; fall back to stub for dev
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
      soilType,
      previousCrop,
      tillageMethod,
      seedRate,
      targetYield,
      description,
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
      areaHectares,
      boundaryGeojson,
      irrigationType,
      soilType,
      previousCrop,
      tillageMethod,
      seedRate,
      targetYield,
      description,
    );

    // Kick off weather pre-fetch in background — do NOT await.
    // The response is already sent; this runs after.
    setImmediate(() => triggerWeatherPrefetch(field.id));

    res.status(201).json(field);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/fields/:fieldId
router.put("/:fieldId", requireAuth, validate({ body: FieldSchema }), async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const existing = await layer1Service.getField(fieldId);
    if (!existing) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }

    // Ownership check — req.farmer.sub is the authenticated farmer's UUID (set by requireAuth)
    if (req.farmer?.sub && existing.farmer_id !== req.farmer.sub) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    const { name, cropType, cropVariety, sowingDate, irrigationType, soilType, previousCrop, tillageMethod, seedRate, targetYield, description } = req.body;
    const updated = await layer1Service.updateField(fieldId, {
      name,
      cropType,
      cropVariety,
      sowingDate,
      irrigationType,
      soilType,
      previousCrop,
      tillageMethod,
      seedRate,
      targetYield,
      description,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/fields/:fieldId
router.delete("/:fieldId", requireAuth, async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const existing = await layer1Service.getField(fieldId);
    if (!existing) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }

    // Ownership check — req.farmer.sub is the authenticated farmer's UUID (set by requireAuth)
    if (req.farmer?.sub && existing.farmer_id !== req.farmer.sub) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    await layer1Service.deleteField(fieldId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export const fieldRoutes = router;
