import { Router } from "express";

import { layer1Service } from "../field/field.service.js";
import { layer3Service } from "../weather/weather.service.js";
import { PythonClient } from "../../services/pythonClient.js";

const router = Router();

/**
 * Safely convert any date-like value to the API contract.
 *
 * FastAPI accepts:
 *
 *     sowing_date: Optional[str]
 *
 * Therefore:
 *
 * null / undefined / invalid -> ""
 */
function safeSowingDate(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return value.toISOString().slice(0, 10);
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return "";
  }

  // Already YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const parsed = new Date(stringValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}


/**
 * Safely read coordinates from the field.
 *
 * Adjust only the candidate property names if your DB schema differs.
 */
function getFieldCoordinates(field) {
  const lat = Number(
    field.latitude ??
      field.lat ??
      field.location?.latitude ??
      field.location?.lat
  );

  const lng = Number(
    field.longitude ??
      field.lng ??
      field.lon ??
      field.location?.longitude ??
      field.location?.lng ??
      field.location?.lon
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}


/**
 * Extract crop context without allowing undefined values to leak into
 * the Python service.
 */
function getCropContext(field) {
  return {
    cropType:
      field.crop_type ??
      field.cropType ??
      field.crop?.type ??
      field.crop?.crop_type ??
      "Unknown crop",

    cropStage:
      field.growth_stage ??
      field.growthStage ??
      field.crop_stage ??
      field.cropStage ??
      field.crop?.growth_stage ??
      field.crop?.growthStage ??
      "Unknown stage",

    sowingDate: safeSowingDate(
      field.sowing_date ??
        field.sowingDate ??
        field.crop?.sowing_date ??
        field.crop?.sowingDate
    ),
  };
}


/**
 * Normalize weather data into a serializable object.
 *
 * We intentionally DO NOT invent weather values.
 */
function normalizeWeatherSummary(weather) {
  if (!weather || typeof weather !== "object") {
    return {};
  }

  return {
    ...weather,
  };
}


/**
 * POST /:fieldId
 *
 * Mounted by the parent module as:
 *
 * /fields/:fieldId/climate-risk
 *
 * If your parent router already includes the fieldId parameter,
 * use req.params.fieldId accordingly.
 */
router.get("/fields/:fieldId/climate-risk", async (req, res) => {
  const { fieldId } = req.params;

  if (!fieldId) {
    return res.status(400).json({
      message: "Field ID is required",
    });
  }

  try {
    // ---------------------------------------------------------------
    // 1. GET FIELD
    // ---------------------------------------------------------------

    const field = await layer1Service.getField(fieldId);

    if (!field) {
      return res.status(404).json({
        message: "Field not found",
      });
    }

    // ---------------------------------------------------------------
    // 2. GET COORDINATES
    // ---------------------------------------------------------------

    const coordinates = getFieldCoordinates(field);

    if (!coordinates) {
      return res.status(422).json({
        message:
          "This field does not have valid coordinates required for weather analysis",
      });
    }

    // ---------------------------------------------------------------
    // 3. GET CROP / STAGE / SOWING DATE
    // ---------------------------------------------------------------

    const crop = getCropContext(field);

    // ---------------------------------------------------------------
    // 4. GET REAL WEATHER FROM LAYER 03
    // ---------------------------------------------------------------

    let weatherSummary = {};

    try {
      const weatherResponse =
        await layer3Service.getLocalizedForecast(fieldId);
        
      const next72h = weatherResponse?.forecasts?.slice(0, 3) || [];
      const summary = {
        temp_max_72h: Math.max(...next72h.map((f) => f.temp_max ?? 0)),
        rainfall_72h_mm: next72h.reduce((s, f) => s + (f.rainfall_mm ?? 0), 0),
        forecast_days: next72h.length,
      };

      weatherSummary = normalizeWeatherSummary(summary);
    } catch (weatherError) {
      console.warn(
        `[ClimateRisk] Weather forecast unavailable for field ${fieldId}:`,
        weatherError.message
      );

      // Do not crash the entire route because weather provider failed.
      // The AI receives an explicit empty weather context and can return
      // severity="unknown".
      weatherSummary = {};
    }

    // ---------------------------------------------------------------
    // 5. OPTIONAL HISTORICAL CONTEXT
    // ---------------------------------------------------------------

    const historicalContext =
      field.climate_history ??
      field.climateHistory ??
      field.weather_history ??
      field.weatherHistory ??
      {};

    // ---------------------------------------------------------------
    // 6. BUILD PYTHON REQUEST
    // ---------------------------------------------------------------

    const aiPayload = {
      field_id: String(fieldId),

      crop_type: String(crop.cropType || "Unknown crop"),

      crop_stage: String(crop.cropStage || "Unknown stage"),

      lat: coordinates.lat,
      lng: coordinates.lng,

      // Never send null.
      sowing_date: crop.sowingDate || "",

      weather_summary: weatherSummary,

      historical_context:
        historicalContext &&
        typeof historicalContext === "object"
          ? historicalContext
          : {},
    };

    // ---------------------------------------------------------------
    // 7. CALL PYTHON AI SERVICE
    // ---------------------------------------------------------------

    const aiResponse = await PythonClient.assessClimateRisk(aiPayload);

    // ---------------------------------------------------------------
    // 8. RETURN PYTHON RESPONSE DIRECTLY
    // ---------------------------------------------------------------

    // DO NOT do:
    //
    // risk_level -> severity
    // primary_risks -> primaryRisks
    //
    // Python is now the source of truth and already returns the
    // frontend contract.

    return res.status(200).json(aiResponse);
  } catch (error) {
    console.error(
      `[ClimateRisk] Failed for field ${fieldId}:`,
      error
    );

    // Do not expose stack traces or internal service details.
    return res.status(502).json({
      message: "Unable to generate climate risk right now",
      code: "CLIMATE_RISK_UNAVAILABLE",
    });
  }
});

export default router;
