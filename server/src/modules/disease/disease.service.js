import { GoogleGenerativeAI } from "@google/generative-ai";
import { query, queryOne } from "../../db/connection.js";
import { layer1Service } from "../field/field.service.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { soilService } from "../soil/soil.service.js";
import { satelliteService } from "../satellite/satellite.service.js";
import { cropStateRepo } from "../../db/repositories/farmerRepository.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const VISION_MODEL = "gemini-3.6-flash";

/** Python FastAPI AI service URL (Layer 07 inference) */
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8001";

/**
 * ObservationService — Layer 07: Crop Disease & Pest/Stress Diagnosis
 *
 * Architecture:
 *   Photo + GPS
 *     → Gemini Vision (image analysis)
 *     → Context assembly: crop + stage + weather + satellite + soil
 *     → Context Fusion: each context layer boosts/weakens image confidence
 *     → Differential diagnosis (top-3 candidates)
 *     → Structured output: condition | category | confidence | severity | evidence
 *     → DB persist (immutable — never overwrite)
 *
 * RULES:
 *   - Gemini never invents data. Context is real, pre-computed evidence.
 *   - "unknown" is a valid diagnosis when confidence is low.
 *   - Every assertion must cite which source supports it.
 *   - Never fabricate weather, NDVI, or soil numbers.
 */
export class ObservationService {
  /**
   * Main entry point.
   * @param {string} fieldId
   * @param {Buffer} imageBuffer - raw image bytes
   * @param {string} mimeType - e.g. "image/jpeg"
   * @param {object} [opts] - { latitude, longitude }
   */
  async diagnoseWithVision(fieldId, imageBuffer, mimeType = "image/jpeg", opts = {}) {
    // ── 1. Gather real field context ──────────────────────────────────────
    const context = await this._assembleContext(fieldId);

    // ── 2a. Try Python ML service (dataset-grounded inference) ────────────
    //        Falls back to direct Gemini Vision if Python service is down.
    let diagnosis;
    const pythonResult = await this._callPythonService(imageBuffer, mimeType, context, opts);
    if (pythonResult) {
      diagnosis = pythonResult;
    } else {
      // ── 2b. Fallback: direct Gemini Vision ──────────────────────────────
      diagnosis = await this._callGeminiVision(imageBuffer, mimeType, context);
    }

    // ── 3. Persist observation (immutable record) ─────────────────────────
    const saved = await this._persist(fieldId, imageBuffer, mimeType, diagnosis, context, opts);

    return saved;
  }

  /**
   * Return all observations for a field, newest first.
   */
  async getObservations(fieldId, limit = 20) {
    const rows = await query(
      `SELECT id, field_id, image_url, crop_type, growth_stage,
              condition_name, condition_category, confidence, severity,
              what_is_happening, why_is_it_happening,
              treatment_recommendation, action_timing, monitor,
              differential_diagnosis, evidence,
              image_quality, escalation_triggered, requires_expert,
              model_name, submitted_at::text
       FROM field_observations
       WHERE field_id = $1
       ORDER BY submitted_at DESC
       LIMIT $2`,
      [fieldId, limit],
    );
    return rows;
  }

  /**
   * Update the farmer feedback (outcome) for an observation (Layer 08)
   */
  async updateObservationOutcome(obsId, fieldId, outcome, outcomeNotes = null) {
    const row = await queryOne(
      `UPDATE field_observations 
       SET outcome = $1, outcome_notes = $2
       WHERE id = $3 AND field_id = $4
       RETURNING *`,
      [outcome, outcomeNotes, obsId, fieldId]
    );
    return row;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Call the Python FastAPI diagnosis service.
   * Sends image + assembled context as multipart/form-data.
   * Returns null if service is unavailable (allows fallback to Gemini).
   */
  async _callPythonService(imageBuffer, mimeType, context, opts = {}) {
    try {
      const { default: FormData } = await import("form-data");
      const { default: fetch } = await import("node-fetch");

      const form = new FormData();

      // Primary image blob
      form.append("image", imageBuffer, {
        filename: "crop.jpg",
        contentType: mimeType,
      });

      // Extra images (whole plant, close-up)
      if (opts.imageBuffer2) {
        form.append("image2", opts.imageBuffer2, {
          filename: "crop2.jpg",
          contentType: opts.mimeType2 || "image/jpeg",
        });
      }
      if (opts.imageBuffer3) {
        form.append("image3", opts.imageBuffer3, {
          filename: "crop3.jpg",
          contentType: opts.mimeType3 || "image/jpeg",
        });
      }

      // Crop context
      form.append("crop_type", context.crop?.crop_type ?? "unknown");
      form.append("crop_stage", context.crop?.growth_stage ?? "unknown");
      if (context.crop?.days_since_sowing != null) {
        form.append("days_since_sowing", String(context.crop.days_since_sowing));
      }
      if (context.crop?.irrigation_type) {
        form.append("irrigation_type", context.crop.irrigation_type);
      }

      // Environmental context as JSON strings
      if (context.weather) form.append("weather_json", JSON.stringify(context.weather));
      if (context.satellite) form.append("satellite_json", JSON.stringify(context.satellite));
      if (context.soil) form.append("soil_json", JSON.stringify(context.soil));

      // Farmer observations (Feature 24)
      if (opts.farmerObservations) {
        form.append("farmer_observations_json", JSON.stringify(opts.farmerObservations));
      }

      const response = await fetch(`${PYTHON_SERVICE_URL}/api/v1/disease/diagnose`, {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Disease] Python service error ${response.status}: ${errText}`);
        return null;
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.warn(`[Disease] Python service unavailable, falling back to Gemini: ${err.message}`);
      return null;
    }
  }

  async _assembleContext(fieldId) {
    const context = { field: null, crop: null, weather: null, satellite: null, soil: null };

    try {
      context.field = await layer1Service.getField(fieldId);
    } catch {}

    try {
      const cropState = await cropStateRepo.getCropState(fieldId);
      const sowingDate = context.field?.sowing_date ? new Date(context.field.sowing_date) : null;
      const days = sowingDate
        ? Math.floor((Date.now() - sowingDate.getTime()) / 86400000)
        : null;
      context.crop = {
        crop_type: context.field?.crop_type ?? "unknown",
        growth_stage: cropState?.current_stage ?? "unknown",
        days_since_sowing: days,
        irrigation_type: context.field?.irrigation_type ?? "unknown",
      };
    } catch {}

    try {
      const snaps = await weatherRepo.getSnapshots(fieldId, 3);
      const latest = snaps[0];
      if (latest) {
        context.weather = {
          temp_max: latest.temp_max,
          temp_min: latest.temp_min,
          humidity_pct: latest.humidity_pct,
          rainfall_mm: latest.rainfall_mm,
          source: latest.source ?? "open-meteo",
        };
      }
    } catch {}

    try {
      const tile = await satelliteService.getLatestForField(fieldId);
      if (tile && tile.ndvi_mean != null) {
        context.satellite = {
          ndvi_mean: tile.ndvi_mean,
          ndvi_trend: tile.trend ?? "unknown",
          observation_date: tile.observation_date,
          data_quality: tile.data_quality,
          cloud_obstructed: tile.cloud_obstructed,
        };
      }
    } catch {}

    try {
      context.soil = await soilService.getActiveSoilProfile(fieldId);
    } catch {}

    return context;
  }

  async _callGeminiVision(imageBuffer, mimeType, context) {
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });

    const prompt = this._buildVisionPrompt(context);

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    };

    let text;
    try {
      const result = await model.generateContent([prompt, imagePart]);
      text = result.response.text();
    } catch (err) {
      throw new Error(`Gemini Vision failed: ${err.message}`);
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Gemini returned non-JSON: ${text.slice(0, 300)}`);

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(`Could not parse Gemini diagnosis JSON: ${jsonMatch[0].slice(0, 300)}`);
    }

    return parsed;
  }

  _buildVisionPrompt(ctx) {
    const c = ctx.crop ?? {};
    const w = ctx.weather;
    const s = ctx.satellite;
    const soil = ctx.soil;

    const cropBlock = `CROP CONTEXT:
  Type: ${c.crop_type ?? "UNAVAILABLE"}
  Growth stage: ${c.growth_stage ?? "UNAVAILABLE"}
  Days since sowing: ${c.days_since_sowing ?? "UNAVAILABLE"}
  Irrigation: ${c.irrigation_type ?? "UNAVAILABLE"}`;

    const weatherBlock = w
      ? `WEATHER (current):
  Max temp: ${w.temp_max ?? "?"}°C  Min temp: ${w.temp_min ?? "?"}°C
  Humidity: ${w.humidity_pct ?? "?"}%
  Recent rainfall: ${w.rainfall_mm ?? "?"}mm
  Source: ${w.source}`
      : "WEATHER: UNAVAILABLE";

    const satelliteBlock = s
      ? s.cloud_obstructed
        ? `SATELLITE: UNAVAILABLE (cloud-obstructed, last clear: ${s.observation_date ?? "unknown"})`
        : `SATELLITE (Sentinel-2, ${s.observation_date}):
  NDVI mean: ${s.ndvi_mean?.toFixed(3) ?? "?"}
  NDVI trend: ${s.ndvi_trend}
  Data quality: ${s.data_quality}`
      : "SATELLITE: UNAVAILABLE";

    const soilBlock = soil
      ? `SOIL (source: ${soil.source}):
  Texture: ${soil.texture ?? "?"}
  pH: ${soil.ph ?? "?"}
  Organic matter: ${soil.organic_matter_pct ?? "?"}%
  Nitrogen: ${soil.nitrogen_level ?? "?"}`
      : "SOIL: UNAVAILABLE";

    return `You are AgriMesh, an agricultural intelligence system diagnosing crop health.

You will receive ONE crop/leaf photograph from an Indian farmer.
Analyze the image alongside the real field context below.

STRICT RULES:
1. Diagnose from BOTH visual evidence AND field context. Never ignore context.
2. If the image is blurry, dark, or too distant — say so and mark image_quality "poor".
3. Distinguish: disease | pest | nutrient_deficiency | water_stress | heat_stress | healthy | unknown.
4. If confidence < 0.55 for ANY condition, set condition_category = "unknown" and requires_expert = true.
5. Weather context: high humidity + rainfall supports fungal disease. Heat supports stress.
6. Satellite: declining NDVI supports stress/disease. Stable NDVI supports healthy.
7. Every evidence item must cite its real source — never invent data.
8. Use simple language a farmer can understand.

---
${cropBlock}

${weatherBlock}

${satelliteBlock}

${soilBlock}
---

Respond ONLY with valid JSON in EXACTLY this format:
{
  "image_quality": "good | fair | poor",
  "condition_name": "Specific condition name, e.g. Cotton Leaf Curl Virus",
  "condition_category": "disease | pest | nutrient_deficiency | water_stress | heat_stress | healthy | unknown",
  "confidence": 0.0-1.0,
  "severity": "low | medium | high | critical | none | unknown",
  "what_is_happening": "Brief description of the suspected issue.",
  "why_is_it_happening": "Explanation combining visual symptoms with field context.",
  "treatment_recommendation": "What should the farmer do to fix this?",
  "action_timing": "When should they act?",
  "monitor": "What should the farmer check next and when?",
  "requires_expert": true | false,
  "escalation_triggered": true | false,
  "differential_diagnosis": [
    { "condition": "name", "probability": 0.0-1.0, "rationale": "why" },
    { "condition": "name", "probability": 0.0-1.0, "rationale": "why" },
    { "condition": "name", "probability": 0.0-1.0, "rationale": "why" }
  ],
  "evidence": [
    { "source": "image | weather | satellite | soil | crop_stage", "finding": "specific data point", "supports_primary": true | false }
  ]
}`;
  }

  async _persist(fieldId, imageBuffer, mimeType, diagnosis, context, opts) {
    // Store image as base64 data URL (for MVP — replace with S3 URL in production)
    const imageUrl = `data:${mimeType};base64,${imageBuffer.toString("base64").slice(0, 100)}...`;

    const row = await queryOne(
      `INSERT INTO field_observations (
         field_id, image_url, image_mime_type,
         latitude, longitude,
         crop_type, growth_stage, days_since_sowing,
         condition_name, condition_category, confidence, severity,
         what_is_happening, why_is_it_happening,
         treatment_recommendation, action_timing, monitor,
         differential_diagnosis, evidence,
         weather_snapshot, satellite_snapshot, soil_snapshot,
         farmer_observations,
         image_quality, escalation_triggered, requires_expert,
         model_name, model_version
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15, $16, $17,
         $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
       )
       RETURNING
         id, field_id, crop_type, growth_stage,
         condition_name, condition_category, confidence::float, severity,
         what_is_happening, why_is_it_happening,
         treatment_recommendation, action_timing, monitor,
         differential_diagnosis, evidence,
         image_quality, escalation_triggered, requires_expert,
         model_name, submitted_at::text`,
      [
        fieldId,
        imageUrl,
        mimeType,
        opts.latitude ?? null,
        opts.longitude ?? null,
        context.crop?.crop_type ?? null,
        context.crop?.growth_stage ?? null,
        context.crop?.days_since_sowing ?? null,
        diagnosis.condition_name ?? "Unknown",
        diagnosis.condition_category ?? "unknown",
        diagnosis.confidence ?? 0,
        diagnosis.severity ?? "unknown",
        diagnosis.what_is_happening ?? null,
        diagnosis.why_is_it_happening ?? null,
        diagnosis.treatment_recommendation ?? null,
        diagnosis.action_timing ?? null,
        diagnosis.monitor ?? null,
        JSON.stringify(diagnosis.differential_diagnosis ?? []),
        JSON.stringify(diagnosis.evidence ?? []),
        context.weather ? JSON.stringify(context.weather) : null,
        context.satellite ? JSON.stringify(context.satellite) : null,
        context.soil ? JSON.stringify(context.soil) : null,
        opts.farmerObservations ? JSON.stringify(opts.farmerObservations) : null,
        diagnosis.image_quality ?? "unknown",
        diagnosis.escalation_triggered ?? false,
        diagnosis.requires_expert ?? false,
        VISION_MODEL,
        "001",
      ],
    );

    return row;
  }
}

export const observationService = new ObservationService();

// Legacy alias
export const layer7Service = {
  getDiagnosisHistory: (fieldId) => observationService.getObservations(fieldId),
};
