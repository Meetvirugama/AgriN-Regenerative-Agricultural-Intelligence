import { Router } from "express";
import { PythonClient } from "../../services/pythonClient.js";
import { layer1Service } from "../field/field.service.js";
import { layer2Service } from "../crop/crop.service.js";
import { layer3Service } from "../weather/weather.service.js";

const router = Router();

// Endpoint for climate risk prediction — delegates to Python AI service
router.get("/fields/:fieldId/climate-risk", async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const field = await layer1Service.getField(fieldId);
    if (!field) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }
    // ClimateRiskRequest (ai-service/models/schemas.py) requires `crop_stage`.
    // It was never being sent here, so FastAPI rejected every request with
    // 422 "Field required" (loc: body -> crop_stage), surfacing to the user
    // as "Unable to load climate risk". Fetch the field's current phenology
    // stage the same way crop.routes.js does, and fall back gracefully
    // (instead of failing the whole widget) if that lookup itself errors —
    // e.g. no crop calendar yet configured for this crop/region.
    let cropStage = "unknown";
    try {
      const cropState = await layer2Service.getFieldCropState(fieldId);
      cropStage = cropState?.current_stage ?? "unknown";
    } catch (stageError) {
      console.warn(
        `[ClimateRisk] Could not resolve crop stage for field ${fieldId}, defaulting to "unknown":`,
        stageError.message,
      );
    }

    let weatherSummary = null;
    try {
      const { forecasts } = await layer3Service.getLocalizedForecast(fieldId);
      const next72h = forecasts.slice(0, 3);
      weatherSummary = {
        temp_max_72h: Math.max(...next72h.map((f) => f.temp_max ?? 0)),
        rainfall_72h_mm: next72h.reduce((s, f) => s + (f.rainfall_mm ?? 0), 0),
        forecast_days: next72h.length,
      };
    } catch (err) {
      console.warn(`[ClimateRisk] Weather unavailable for field ${fieldId}: ${err.message}`);
    }

    let sowingDateStr = null;
    if (field.sowing_date) {
      try {
        sowingDateStr = new Date(field.sowing_date).toISOString();
      } catch (e) {
        sowingDateStr = String(field.sowing_date);
      }
    }

    const result = await PythonClient.assessClimateRisk({
      field_id: fieldId,
      crop_type: field.crop_type,
      crop_stage: cropStage,
      lat: field.lat,
      lng: field.lng,
      sowing_date: sowingDateStr,
      weather_summary: weatherSummary,
    });

    res.json(result);
  } catch (error) {
    console.error("[ClimateRisk] Error:", error.message);
    next(error);
  }
});

export default router;
