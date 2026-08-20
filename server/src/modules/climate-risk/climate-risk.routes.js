import { Router } from "express";
import { PythonClient } from "../../services/pythonClient.js";
import { layer1Service } from "../field/field.service.js";

const router = Router();

// Endpoint for climate risk prediction — delegates to Python AI service
router.get("/fields/:fieldId/climate-risk", async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const field = await layer1Service.getField(fieldId);
    if (!field) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }
    const result = await PythonClient.assessClimateRisk({
      field_id: fieldId,
      crop_type: field.crop_type,
      lat: field.lat,
      lng: field.lng,
      sowing_date: field.sowing_date,
    });
    res.json(result);
  } catch (error) {
    console.error("[ClimateRisk] Error:", error.message);
    next(error);
  }
});

export default router;
