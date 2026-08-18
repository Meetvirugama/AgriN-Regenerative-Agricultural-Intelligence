import { Router } from "express";
import { layer1Service, STUB_FARMER_ID } from "./field.service.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ─── Helper: fire-and-forget weather pre-fetch ─────────────────────────────
// Imported lazily to avoid circular deps. Errors are intentionally swallowed
// so a weather API outage never blocks field creation.
async function triggerWeatherPrefetch(fieldId) {
  try {
    const { layer3Service } = await import("../weather/weather.service.js");
    await layer3Service.fetchAndStoreForecast(fieldId);
    console.log(`[Weather] Pre-fetched for new field ${fieldId}`);
  } catch (err) {
    console.warn(`[Weather] Pre-fetch failed for field ${fieldId} (non-fatal):`, err.message);
  }
}

// GET /api/v1/fields
router.get("/", async (req, res, next) => {
  try {
    const farmerId = req.user?.id || STUB_FARMER_ID;
    if (!req.user) {
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

// POST /api/v1/fields
router.post("/", async (req, res, next) => {
  try {
    const farmerId = req.user?.id || STUB_FARMER_ID;
    if (!req.user) await layer1Service.getOrCreateMockFarmer();

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
      irrigationType,      // ← was previously dropped; now properly captured
    } = req.body;

    if (!name || !cropType || !sowingDate) {
      return res.status(400).json({ error: { message: "name, cropType, and sowingDate are required" } });
    }

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
router.put("/:fieldId", requireAuth, async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const existing = await layer1Service.getField(fieldId);
    if (!existing) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }

    // Ownership check — only the farmer who owns the field can edit it
    if (req.user?.id && existing.farmer_id !== req.user.id) {
      return res.status(403).json({ error: { message: "Forbidden" } });
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
});

// DELETE /api/v1/fields/:fieldId
router.delete("/:fieldId", requireAuth, async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const existing = await layer1Service.getField(fieldId);
    if (!existing) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }

    // Ownership check
    if (req.user?.id && existing.farmer_id !== req.user.id) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    await layer1Service.deleteField(fieldId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export const fieldRoutes = router;
