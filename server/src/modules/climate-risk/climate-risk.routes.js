import { Router } from "express";
import { layer1Service } from "../field/field.service.js";
import { layer3Service } from "../weather/weather.service.js";
import { PythonClient } from "../../services/pythonClient.js";

const router = Router();

function safeSowingDate(value) {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }
  const stringValue = String(value).trim();
  if (!stringValue) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) return stringValue;
  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function getFieldCoordinates(field) {
  const lat = Number(
    field.latitude ?? field.lat ?? field.location?.latitude ?? field.location?.lat
  );
  const lng = Number(
    field.longitude ?? field.lng ?? field.lon ?? field.location?.longitude ?? field.location?.lng ?? field.location?.lon
  );
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getCropContext(field) {
  return {
    cropType: field.crop_type ?? field.cropType ?? field.crop?.type ?? "Unknown crop",
    cropStage: field.growth_stage ?? field.growthStage ?? field.crop_stage ?? field.cropStage ?? "Unknown stage",
    sowingDate: safeSowingDate(field.sowing_date ?? field.sowingDate ?? field.crop?.sowing_date),
  };
}



/**
 * GET /api/v1/fields/:fieldId/climate-risk
 */
router.get("/fields/:fieldId/climate-risk", async (req, res) => {
  const { fieldId } = req.params;

  if (!fieldId) {
    return res.status(400).json({ message: "Field ID is required" });
  }

  try {
    // 1. Get field
    const field = await layer1Service.getField(fieldId);
    if (!field) return res.status(404).json({ message: "Field not found" });

    // 2. Validate coordinates
    const coordinates = getFieldCoordinates(field);
    if (!coordinates) {
      return res.status(422).json({
        message: "This field does not have valid coordinates required for weather analysis",
      });
    }

    // 3. Get crop context
    const crop = getCropContext(field);

    // 4. Get weather from Open-Meteo
    let weatherSummary = {};
    try {
      const weatherResponse = await layer3Service.getLocalizedForecast(fieldId);
      const next72h = weatherResponse?.forecasts?.slice(0, 3) || [];
      weatherSummary = {
        temp_max_72h: Math.max(...next72h.map((f) => f.temp_max ?? 0)),
        rainfall_72h_mm: next72h.reduce((s, f) => s + (f.rainfall_mm ?? 0), 0),
        humidity_pct: next72h[0]?.humidity_pct ?? null,
        forecast_days: next72h.length,
        flags: weatherResponse?.flags ?? [],
      };
    } catch (weatherError) {
      console.warn(`[ClimateRisk] Weather forecast unavailable for field ${fieldId}:`, weatherError.message);
    }

    const historicalContext = field.climate_history ?? field.climateHistory ?? field.weather_history ?? {};

    const aiPayload = {
      field_id: String(fieldId),
      crop_type: String(crop.cropType || "Unknown crop"),
      crop_stage: String(crop.cropStage || "Unknown stage"),
      lat: coordinates.lat,
      lng: coordinates.lng,
      sowing_date: crop.sowingDate || "",
      weather_summary: weatherSummary,
      historical_context: historicalContext && typeof historicalContext === "object" ? historicalContext : {},
    };

    // 5. Call Python AI service
    let aiResponse;
    try {
      aiResponse = await PythonClient.assessClimateRisk(aiPayload);
      console.log(`[ClimateRisk] Generated via Python AI service for field ${fieldId}`);
    } catch (pythonErr) {
      console.error(`[ClimateRisk] Python service failed: ${pythonErr.message}`);
      throw new Error(`AI service unavailable: ${pythonErr.message}`);
    }

    return res.status(200).json(aiResponse);
  } catch (error) {
    console.error(`[ClimateRisk] Failed for field ${fieldId}:`, error);
    return res.status(502).json({
      message: "Unable to generate climate risk right now",
      code: "CLIMATE_RISK_UNAVAILABLE",
    });
  }
});

export default router;
