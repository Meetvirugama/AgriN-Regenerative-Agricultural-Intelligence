import { Router } from "express";
import { layer1Service, STUB_FARMER_ID } from "./field.service.js";
import { requireAuth } from "../../middleware/auth.js"; // Optional, depending on if we mock it

const router = Router();

// GET /api/v1/fields
// Fetch all fields for the currently logged-in user (or mocked user)
router.get("/", async (req, res, next) => {
  try {
    // For MVP Phase 1: if no user is authenticated, use the stub farmer.
    // In Phase 2, we will use req.user.id
    const farmerId = req.user?.id || STUB_FARMER_ID;
    
    // Ensure the stub farmer exists just in case
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
    const { name, cropType, sowingDate, cropVariety, lat, lng, locationName, areaHectares, boundaryGeojson } = req.body;

    if (!name || !cropType || !sowingDate) {
      return res.status(400).json({ error: { message: "Missing required fields" } });
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
      boundaryGeojson
    );
    res.status(201).json(field);
  } catch (err) {
    next(err);
  }
});

export const fieldRoutes = router;
