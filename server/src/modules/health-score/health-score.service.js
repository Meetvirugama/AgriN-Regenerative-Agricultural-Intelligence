import { satelliteStore } from "../satellite/satellite.store.js";
import { cropStateRepo } from "../../db/repositories/farmerRepository.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { soilRepo } from "../../db/repositories/soilRepository.js";
import { PythonClient } from "../../services/pythonClient.js";

export class HealthScoreService {
  async computeScore(fieldId) {
    // ── Layer 05: Satellite (already real) ─────────────────────────────────
    const latestTile = await satelliteStore.getLatestTile(fieldId);
    const latestTrend = await satelliteStore.getLatestTrend(fieldId);
    const activeAnomalies = await satelliteStore.getActiveAnomalies(fieldId);

    // ── Layer 02: Crop Stage (now real from Postgres) ──────────────────────
    const cropState = await cropStateRepo.getCropState(fieldId);
    const cropStage = {
      stage: cropState?.current_stage ?? "vegetative",
      waterNeed: this.stageWaterNeed(cropState?.current_stage ?? "vegetative"),
      diseaseSusceptibility: this.stageDiseaseRisk(
        cropState?.current_stage ?? "vegetative",
      ),
    };

    // ── Layer 03: Weather (now real from Postgres) ─────────────────────────
    const recentSnapshots = await weatherRepo.getSnapshots(fieldId, 7);
    const activeFlags = await weatherRepo.getActiveFlags(fieldId);
    const avgRainfall =
      recentSnapshots
        .filter((s) => !s.is_forecast)
        .reduce((sum, s) => sum + (s.rainfall_mm ?? 0), 0) /
      Math.max(recentSnapshots.filter((s) => !s.is_forecast).length, 1);
    const forecastRain = recentSnapshots
      .filter((s) => s.is_forecast)
      .reduce((sum, s) => sum + (s.rainfall_mm ?? 0), 0);
    const maxForecastTemp = Math.max(
      ...recentSnapshots
        .filter((s) => s.is_forecast)
        .map((s) => s.temp_max ?? 28),
      28,
    );
    const avgHumidity =
      recentSnapshots.length > 0
        ? recentSnapshots.reduce((sum, s) => sum + (s.humidity_pct ?? 60), 0) /
          recentSnapshots.length
        : 60;

    const weather = {
      recentRainfallMm: avgRainfall,
      forecastRainfallMm: forecastRain,
      forecastHighTemp: maxForecastTemp,
      humidityAvg: avgHumidity,
      activeFlags: activeFlags.map((f) => f.event_type),
    };

    // ── Layer 04: Soil (now real from Postgres) ────────────────────────────
    const soilProfile = await soilRepo.getLatestProfile(fieldId);
    const soil = {
      texture: soilProfile?.texture ?? "loam",
      waterHoldingCapacity: soilProfile?.water_holding_capacity ?? "medium",
      nitrogenLevel: soilProfile?.nitrogen_level ?? "medium",
    };

    // ── Call Python for computation ─────────────────────────────────────────
    const computed = await PythonClient.computeHealthScore({
      field_id: fieldId,
      latest_tile: latestTile,
      latest_trend: latestTrend,
      active_anomalies: activeAnomalies,
      crop_stage: cropStage,
      weather: weather,
      soil: soil,
    });

    return {
      fieldId,
      computedAt: new Date().toISOString(),
      crop_health: computed.crop_health,
      water_condition: computed.water_condition,
      soil_condition: computed.soil_condition,
      weather_risk: computed.weather_risk,
      disease_risk: computed.disease_risk,
      climate_stress: computed.climate_stress,
      vegetation_trend: computed.vegetation_trend,
      synthesis_text: null, // Phase 6: AI-generated synthesis
    };
  }

  /** Helper: map crop stage to water need label */
  stageWaterNeed(stage) {
    const map = {
      germination: "Moderate",
      vegetative: "Moderate",
      flowering: "High",
      maturity: "Low",
    };
    return map[stage] ?? "Moderate";
  }

  /** Helper: map crop stage to disease susceptibility */
  stageDiseaseRisk(stage) {
    const map = {
      germination: "Low",
      vegetative: "Moderate",
      flowering: "High",
      maturity: "Moderate",
    };
    return map[stage] ?? "Moderate";
  }
}

export const healthScoreService = new HealthScoreService();
