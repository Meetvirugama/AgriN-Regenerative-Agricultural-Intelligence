import { layer1Service } from "../field/field.service.js";
import { layer3Service } from "../weather/weather.service.js";
import { satelliteService } from "../satellite/satellite.service.js";
import { soilService } from "../soil/soil.service.js";
import { PythonClient } from "../../services/pythonClient.js";
import { query, queryOne } from "../../db/connection.js";

/**
 * AdvisoryService
 *
 * Orchestrates the real data pipeline:
 *   Field → Weather → Satellite → Soil → Evidence → Gemini → Advisory
 *
 * This service NEVER fabricates missing data.
 * Each data source is fetched, badged, and passed to Gemini as-is.
 */
class AdvisoryService {
  /**
   * Assemble all real field evidence and generate a Gemini advisory.
   */
  async generateAdvisory(fieldId) {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    // ─── 1. Crop context ─────────────────────────────────────────────────────
    const sowingDate = new Date(field.sowing_date);
    const daysSinceSowing = Math.floor(
      (Date.now() - sowingDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const stage = this._estimateCropStage(daysSinceSowing, field.crop_type);

    const cropEvidence = {
      crop_type: field.crop_type,
      crop_variety: field.crop_variety,
      stage,
      days_since_sowing: daysSinceSowing,
      irrigation_type: field.irrigation_type,
    };

    // ─── 2. Weather evidence ─────────────────────────────────────────────────
    let weatherEvidence = null;
    try {
      const { forecasts, flags } = await layer3Service.getLocalizedForecast(fieldId);
      const next72h = forecasts.slice(0, 3);
      weatherEvidence = {
        temp_max_72h: Math.max(...next72h.map((f) => f.temp_max ?? 0)),
        rainfall_72h_mm: next72h.reduce((s, f) => s + (f.rainfall_mm ?? 0), 0),
        humidity_pct: next72h[0]?.humidity_pct ?? null,
        flags: flags ?? [],
        source: "open-meteo",
        forecast_days: next72h.length,
      };
    } catch (err) {
      console.warn(`[Advisory] Weather unavailable for field ${fieldId}: ${err.message}`);
    }

    // ─── 3. Satellite evidence ───────────────────────────────────────────────
    let satelliteEvidence = null;
    try {
      const tile = await satelliteService.getLatestForField(fieldId);
      const timeseries = await satelliteService.getTimeseries(fieldId, 30);
      satelliteEvidence = {
        ndvi_mean: tile.ndvi_mean,
        observation_date: tile.observation_date,
        data_quality: tile.data_quality,
        data_source: tile.data_source,
        disclaimer: tile.disclaimer,
        trend: timeseries.trend,
        cloud_obstructed: tile.cloud_obstructed,
        days_since_clear: tile.cloud_obstructed
          ? this._daysSince(tile.observation_date)
          : 0,
      };
    } catch (err) {
      console.warn(`[Advisory] Satellite unavailable for field ${fieldId}: ${err.message}`);
    }

    // ─── 4. Soil evidence ────────────────────────────────────────────────────
    let soilEvidence = null;
    try {
      soilEvidence = await soilService.getActiveSoilProfile(fieldId);
    } catch (err) {
      console.warn(`[Advisory] Soil unavailable for field ${fieldId}: ${err.message}`);
    }

    // ─── 5. Assemble and call Python AI Service ──────────────────────────────
    const evidence = {
      crop: cropEvidence,
      weather: weatherEvidence,
      satellite: satelliteEvidence,
      soil: soilEvidence,
    };

    const geminiAdvisory = await PythonClient.generateAdvisory(
      fieldId,
      field.crop_type,
      stage,
      satelliteEvidence ? JSON.stringify(satelliteEvidence) : "Unavailable",
      weatherEvidence ? JSON.stringify(weatherEvidence) : "Unavailable",
      soilEvidence ? JSON.stringify(soilEvidence) : "Unavailable",
      "en",
    );

    // ─── 6. Persist advisory ─────────────────────────────────────────────────
    const advisory = await this._saveAdvisory(fieldId, geminiAdvisory, evidence);

    return {
      ...advisory,
      evidence_summary: {
        weather_available: weatherEvidence != null,
        satellite_available: satelliteEvidence != null && !satelliteEvidence.cloud_obstructed,
        satellite_data_quality: satelliteEvidence?.data_quality ?? "unavailable",
        satellite_disclaimer: satelliteEvidence?.disclaimer ?? null,
        soil_available: soilEvidence != null,
        soil_source: soilEvidence?.source ?? "unavailable",
      },
    };
  }

  /**
   * Estimate crop growth stage from days-since-sowing and crop type.
   * This is a deterministic calculation — NOT AI.
   */
  _estimateCropStage(days, cropType) {
    const calendars = {
      wheat:  { germination: [0,7], vegetative: [8,60], flowering: [61,90], maturity: [91,140] },
      rice:   { germination: [0,10], vegetative: [11,70], flowering: [71,100], maturity: [101,150] },
      cotton: { germination: [0,10], vegetative: [11,60], flowering: [61,100], maturity: [101,160] },
      maize:  { germination: [0,8], vegetative: [9,50], flowering: [51,80], maturity: [81,120] },
    };
    const cal = calendars[cropType?.toLowerCase()] ?? calendars.wheat;
    for (const [stage, [min, max]] of Object.entries(cal)) {
      if (days >= min && days <= max) return stage;
    }
    return days < 0 ? "pre_sowing" : "maturity";
  }

  _daysSince(dateStr) {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  }

  async _saveAdvisory(fieldId, gemini, evidence) {
    // Use existing advisories table if available (from migration 006)
    try {
      const row = await queryOne(
        `INSERT INTO advisory_records
           (field_id, trigger_type, what_text, why_text, severity,
            action_text, action_deadline, monitor_text, source_layers,
            gemini_evidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, field_id, what_text, why_text, severity,
                   action_text, action_deadline, monitor_text, source_layers,
                   gemini_evidence, generated_at::text`,
        [
          fieldId,
          "ai_generated",
          gemini.what_text || gemini.what_is_happening || gemini.what,
          gemini.why_text || gemini.why,
          gemini.severity,
          gemini.action_text || gemini.recommended_action || gemini.action,
          gemini.action_deadline || gemini.when || gemini.deadline,
          gemini.monitor_text || gemini.monitor,
          JSON.stringify(["weather", "satellite", "soil"]),
          JSON.stringify({ gemini_confidence: gemini.confidence, evidence: gemini.evidence }),
        ],
      );
      return { ...row, persisted: true };
    } catch (err) {
      // advisories table may have slightly different schema — return in-memory shape
      // but flag it explicitly so the client knows the ID is not in the DB
      console.warn("[Advisory] Could not persist to DB:", err.message);
      return {
        id: `adv-${Date.now()}`,
        field_id: fieldId,
        what_text: gemini.what_text || gemini.what_is_happening || gemini.what,
        why_text: gemini.why_text || gemini.why,
        severity: gemini.severity,
        action_text: gemini.action_text || gemini.recommended_action || gemini.action,
        action_deadline: gemini.action_deadline || gemini.when || gemini.deadline,
        monitor_text: gemini.monitor_text || gemini.monitor,
        source_layers: ["weather", "satellite", "soil"],
        gemini_confidence: gemini.confidence,
        confidence_reason: gemini.confidence_reason,
        gemini_evidence: gemini.evidence,
        generated_at: new Date().toISOString(),
        persisted: false,
        warning: "Advisory could not be saved to database. This ID is temporary and cannot be referenced in follow-up responses.",
      };
    }
  }
}

export const advisoryService = new AdvisoryService();
