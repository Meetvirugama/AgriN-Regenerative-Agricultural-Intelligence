import { satelliteService } from "../satellite/satellite.service.js";
import { cropStateRepo } from "../../db/repositories/farmerRepository.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { soilService } from "../soil/soil.service.js";
import { layer1Service } from "../field/field.service.js";

/**
 * HealthScoreService — Layer 06
 *
 * Computes a 0–100 field health score from REAL data using deterministic
 * weighted arithmetic. NO AI is called here. Gemini receives this score
 * and its evidence to explain and recommend actions.
 *
 * Weights (must sum to 1.0):
 *   NDVI / vegetation health  40%
 *   Weather risk              30%
 *   Soil quality              20%
 *   Crop stage stress         10%
 */
export class HealthScoreService {
  async computeScore(fieldId) {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    const evidence = [];

    // ── 1. NDVI Score (40%) ────────────────────────────────────────────────
    let ndviScore = 50; // neutral default when satellite unavailable
    let satelliteAvailable = false;

    try {
      const tile = await satelliteService.getLatestForField(fieldId);
      const timeseries = await satelliteService.getTimeseries(fieldId, 30);

      if (tile && !tile.cloud_obstructed && tile.ndvi_mean != null) {
        satelliteAvailable = true;
        const ndvi = tile.ndvi_mean;

        // NDVI → score mapping (based on crop health literature)
        // < 0.2 = bare/stressed, 0.2–0.4 = poor, 0.4–0.6 = moderate,
        // 0.6–0.8 = healthy, > 0.8 = very healthy
        const rawNdvi = Math.max(0, Math.min(1, ndvi));
        ndviScore = Math.round(rawNdvi * 100);

        // Trend bonus/penalty: ±10 points
        const trendAdjust =
          timeseries.trend === "improving" ? 10
          : timeseries.trend === "declining" ? -10
          : 0;
        ndviScore = Math.max(0, Math.min(100, ndviScore + trendAdjust));

        evidence.push({
          source: "satellite",
          metric: "NDVI",
          value: ndvi,
          trend: timeseries.trend,
          finding: `NDVI ${ndvi.toFixed(3)} (${timeseries.trend}) from ${tile.data_source} on ${tile.observation_date}`,
          data_quality: tile.data_quality,
        });
      } else {
        evidence.push({
          source: "satellite",
          metric: "NDVI",
          value: null,
          finding: tile?.cloud_obstructed
            ? `Satellite obstructed (cloud cover). Last clear image: ${tile.observation_date ?? "unknown"}`
            : "No satellite observation available",
          data_quality: "unavailable",
        });
      }
    } catch (err) {
      evidence.push({ source: "satellite", metric: "NDVI", finding: `Unavailable: ${err.message}`, data_quality: "unavailable" });
    }

    // ── 2. Weather Score (30%) ─────────────────────────────────────────────
    let weatherScore = 70; // moderate default
    let weatherRiskFlags = [];

    try {
      const snapshots = await weatherRepo.getSnapshots(fieldId, 7);
      const flags = await weatherRepo.getActiveFlags(fieldId);
      weatherRiskFlags = flags.map((f) => f.event_type);

      if (snapshots.length > 0) {
        const forecasts = snapshots.filter((s) => s.is_forecast);
        const maxTemp = Math.max(...forecasts.map((s) => s.temp_max ?? 28), 28);
        const totalRain = forecasts.reduce((sum, s) => sum + (s.rainfall_mm ?? 0), 0);

        // Penalty for heat stress (> 35°C = moderate, > 40°C = severe)
        let heatPenalty = maxTemp > 40 ? 30 : maxTemp > 35 ? 15 : 0;

        // Penalty for drought risk (< 5mm forecast rain in peak stage)
        let droughtPenalty = totalRain < 5 ? 15 : 0;

        // Penalty for active weather flags (e.g. heat_wave, frost)
        let flagPenalty = flags.length * 8;

        weatherScore = Math.max(0, 100 - heatPenalty - droughtPenalty - flagPenalty);

        evidence.push({
          source: "weather",
          metric: "risk",
          finding: `Max temp ${maxTemp}°C, ${totalRain.toFixed(1)}mm forecast rain. Active flags: ${flags.length > 0 ? weatherRiskFlags.join(", ") : "none"}`,
          data_quality: "real",
        });
      }
    } catch (err) {
      evidence.push({ source: "weather", metric: "risk", finding: `Unavailable: ${err.message}`, data_quality: "unavailable" });
    }

    // ── 3. Soil Score (20%) ────────────────────────────────────────────────
    let soilScore = 65; // conservative default

    try {
      const soil = await soilService.getActiveSoilProfile(fieldId);
      if (soil) {
        // pH scoring: optimal range 6.0–7.5
        const ph = soil.ph ?? 7.0;
        const phScore = ph >= 6.0 && ph <= 7.5 ? 100
          : ph >= 5.5 && ph < 6.0 ? 70
          : ph > 7.5 && ph <= 8.0 ? 70
          : 40;

        // Organic matter scoring
        const om = soil.organic_matter_pct ?? 1.5;
        const omScore = om >= 3.0 ? 100 : om >= 1.5 ? 70 : 40;

        // Nitrogen level scoring
        const nScore = soil.nitrogen_level === "high" ? 100
          : soil.nitrogen_level === "medium" ? 70
          : 40;

        soilScore = Math.round((phScore + omScore + nScore) / 3);

        evidence.push({
          source: "soil",
          metric: "quality",
          finding: `pH ${ph}, organic matter ${om?.toFixed(2) ?? "?"}%, N: ${soil.nitrogen_level ?? "?"} (source: ${soil.source})`,
          data_quality: soil.source === "lab_report" ? "high" : soil.source === "soilgrids" ? "real" : "estimated",
        });
      }
    } catch (err) {
      evidence.push({ source: "soil", metric: "quality", finding: `Unavailable: ${err.message}`, data_quality: "unavailable" });
    }

    // ── 4. Crop Stage Stress Score (10%) ──────────────────────────────────
    let stageScore = 75; // moderate default

    try {
      const sowingDate = new Date(field.sowing_date);
      const daysSinceSowing = Math.floor((Date.now() - sowingDate.getTime()) / 86400000);

      // Flowering stage is highest stress (needs most attention)
      const cropState = await cropStateRepo.getCropState(fieldId);
      const stage = cropState?.current_stage ?? this._estimateStage(daysSinceSowing, field.crop_type);

      stageScore = stage === "flowering" ? 60   // critical stage = inherently more at risk
        : stage === "germination" ? 55            // fragile stage
        : stage === "vegetative" ? 75
        : stage === "maturity" ? 85
        : 70;

      evidence.push({
        source: "crop_stage",
        metric: "stage_stress",
        finding: `Crop: ${field.crop_type}, stage: ${stage}, ${daysSinceSowing} days since sowing`,
        data_quality: cropState ? "confirmed" : "estimated",
      });
    } catch (err) {
      evidence.push({ source: "crop_stage", metric: "stage_stress", finding: `Unavailable: ${err.message}`, data_quality: "unavailable" });
    }

    // ── 5. Weighted composite score ────────────────────────────────────────
    const score = Math.round(
      ndviScore * 0.40 +
      weatherScore * 0.30 +
      soilScore * 0.20 +
      stageScore * 0.10
    );

    const category =
      score >= 75 ? "good"
      : score >= 50 ? "moderate"
      : score >= 30 ? "poor"
      : "critical";

    return {
      fieldId,
      computedAt: new Date().toISOString(),
      score,          // 0–100
      category,       // good | moderate | poor | critical
      components: {
        ndvi:    { score: ndviScore,   weight: 0.40, satellite_available: satelliteAvailable },
        weather: { score: weatherScore, weight: 0.30, active_flags: weatherRiskFlags },
        soil:    { score: soilScore,   weight: 0.20 },
        stage:   { score: stageScore,  weight: 0.10 },
      },
      evidence,       // Full trail — surfaces in UI and Gemini advisory
    };
  }

  _estimateStage(days, cropType) {
    const calendars = {
      wheat:  { germination: [0, 7], vegetative: [8, 60], flowering: [61, 90], maturity: [91, 140] },
      rice:   { germination: [0, 10], vegetative: [11, 70], flowering: [71, 100], maturity: [101, 150] },
      cotton: { germination: [0, 10], vegetative: [11, 60], flowering: [61, 100], maturity: [101, 160] },
      maize:  { germination: [0, 8], vegetative: [9, 50], flowering: [51, 80], maturity: [81, 120] },
    };
    const cal = calendars[cropType?.toLowerCase()] ?? calendars.wheat;
    for (const [stage, [min, max]] of Object.entries(cal)) {
      if (days >= min && days <= max) return stage;
    }
    return days < 0 ? "pre_sowing" : "maturity";
  }
}

export const healthScoreService = new HealthScoreService();
