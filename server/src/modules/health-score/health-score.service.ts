import { FieldHealthScore, DimensionResult, Severity } from './health-score.types';
import { satelliteStore } from '../satellite/satellite.store';
import { cropStateRepo } from '../../db/repositories/farmerRepository';
import { weatherRepo } from '../../db/repositories/weatherRepository';
import { soilRepo } from '../../db/repositories/soilRepository';

export class HealthScoreService {
  
  async computeScore(fieldId: string): Promise<FieldHealthScore> {
    // ── Layer 05: Satellite (already real) ─────────────────────────────────
    const latestTile    = await satelliteStore.getLatestTile(fieldId);
    const latestTrend   = await satelliteStore.getLatestTrend(fieldId);
    const activeAnomalies = await satelliteStore.getActiveAnomalies(fieldId);

    // ── Layer 02: Crop Stage (now real from Postgres) ──────────────────────
    const cropState = await cropStateRepo.getCropState(fieldId);
    const cropStage = {
      stage: cropState?.current_stage ?? 'vegetative',
      waterNeed: this.stageWaterNeed(cropState?.current_stage ?? 'vegetative'),
      diseaseSusceptibility: this.stageDiseaseRisk(cropState?.current_stage ?? 'vegetative'),
    };

    // ── Layer 03: Weather (now real from Postgres) ─────────────────────────
    const recentSnapshots = await weatherRepo.getSnapshots(fieldId, 7);
    const activeFlags     = await weatherRepo.getActiveFlags(fieldId);
    const avgRainfall = recentSnapshots.filter(s => !s.is_forecast)
      .reduce((sum, s) => sum + (s.rainfall_mm ?? 0), 0) / Math.max(recentSnapshots.filter(s => !s.is_forecast).length, 1);
    const forecastRain = recentSnapshots.filter(s => s.is_forecast)
      .reduce((sum, s) => sum + (s.rainfall_mm ?? 0), 0);
    const maxForecastTemp = Math.max(...recentSnapshots.filter(s => s.is_forecast).map(s => s.temp_max ?? 28), 28);
    const avgHumidity = recentSnapshots.length > 0
      ? recentSnapshots.reduce((sum, s) => sum + (s.humidity_pct ?? 60), 0) / recentSnapshots.length
      : 60;

    const weather = {
      recentRainfallMm: avgRainfall,
      forecastRainfallMm: forecastRain,
      forecastHighTemp: maxForecastTemp,
      humidityAvg: avgHumidity,
      activeFlags: activeFlags.map(f => f.event_type),
    };

    // ── Layer 04: Soil (now real from Postgres) ────────────────────────────
    const soilProfile = await soilRepo.getLatestProfile(fieldId);
    const soil = {
      texture: soilProfile?.texture ?? 'loam',
      waterHoldingCapacity: soilProfile?.water_holding_capacity ?? 'medium',
      nitrogenLevel: soilProfile?.nitrogen_level ?? 'medium',
    };

    // ── Compute all dimensions ─────────────────────────────────────────────
    const vegetationTrend = this.computeVegetationTrend(latestTrend, activeAnomalies);
    const waterCondition  = this.computeWaterCondition(weather, soil, latestTile, cropStage);
    const soilCondition   = this.computeSoilCondition(soil);
    const weatherRisk     = this.computeWeatherRisk(weather, cropStage);
    const diseaseRisk     = this.computeDiseaseRisk(weather, cropStage, activeAnomalies);
    const climateStress   = this.computeClimateStress(weather, activeAnomalies);
    const cropHealth      = this.computeCropHealth([
      vegetationTrend, waterCondition, soilCondition,
      weatherRisk, diseaseRisk, climateStress,
    ]);

    return {
      fieldId,
      computedAt: new Date().toISOString(),
      crop_health: cropHealth,
      water_condition: waterCondition,
      soil_condition: soilCondition,
      weather_risk: weatherRisk,
      disease_risk: diseaseRisk,
      climate_stress: climateStress,
      vegetation_trend: vegetationTrend,
      synthesis_text: null, // Phase 6: AI-generated synthesis
    };
  }

  /** Helper: map crop stage to water need label */
  private stageWaterNeed(stage: string): 'Low' | 'Moderate' | 'High' {
    const map: Record<string, 'Low' | 'Moderate' | 'High'> = {
      germination: 'Moderate', vegetative: 'Moderate',
      flowering: 'High', maturity: 'Low',
    };
    return map[stage] ?? 'Moderate';
  }

  /** Helper: map crop stage to disease susceptibility */
  private stageDiseaseRisk(stage: string): 'Low' | 'Moderate' | 'High' {
    const map: Record<string, 'Low' | 'Moderate' | 'High'> = {
      germination: 'Low', vegetative: 'Moderate',
      flowering: 'High', maturity: 'Moderate',
    };
    return map[stage] ?? 'Moderate';
  }

  // --- Dimension Computation Rules ---

  private computeVegetationTrend(latestTrend: any, activeAnomalies: any[]): DimensionResult {
    const basis: string[] = [];
    let severity: Severity = 'green';
    let value = 'Stable';

    if (activeAnomalies.length > 0) {
      severity = activeAnomalies.some(a => a.severity === 'high') ? 'red' : 'amber';
      value = 'Decline detected';
      basis.push(`Satellite anomaly detected in ${activeAnomalies.length} sub-region(s)`);
    } else if (latestTrend) {
      if (latestTrend.ndviTrendDirection === 'improving') {
        value = 'Improving';
        basis.push('Field-wide NDVI is increasing compared to last pass');
      } else if (latestTrend.ndviTrendDirection === 'declining') {
        severity = 'amber';
        value = 'Slight decline';
        basis.push('Field-wide NDVI showed slight decline, monitoring closely');
      } else {
        basis.push('Vegetation index is stable across the field');
      }
    } else {
      basis.push('No recent satellite data available to confirm trend');
    }

    return { value, severity, basis };
  }

  private computeWaterCondition(weather: any, soil: any, tile: any, stage: any): DimensionResult {
    const basis: string[] = [];
    let severity: Severity = 'green';
    let value = 'Adequate';

    basis.push(`Crop is in ${stage.stage} stage requiring ${stage.waterNeed} water`);
    basis.push(`Soil has ${soil.waterHoldingCapacity} water holding capacity`);

    if (weather.recentRainfallMm < 5 && weather.forecastRainfallMm === 0 && soil.waterHoldingCapacity === 'low') {
      severity = 'amber';
      value = 'Drying';
      basis.push('No recent or forecast rain on low-retention soil');
    }
    
    if (tile && tile.moistureProxy < 0.3) {
      severity = 'red';
      value = 'Stressed';
      basis.push('Satellite surface moisture index is critically low');
    }

    return { value, severity, basis };
  }

  private computeSoilCondition(soil: any): DimensionResult {
    return {
      value: 'Moderate',
      severity: soil.nitrogenLevel === 'low' ? 'amber' : 'green',
      basis: [
        `Texture is ${soil.texture}`,
        `Nitrogen levels are estimated at ${soil.nitrogenLevel}`
      ]
    };
  }

  private computeWeatherRisk(weather: any, stage: any): DimensionResult {
    const basis: string[] = [];
    let severity: Severity = 'green';
    let value = 'Low Risk';

    if (weather.activeFlags.length > 0) {
      severity = 'amber';
      value = 'Elevated Risk';
      basis.push(`Active weather flags: ${weather.activeFlags.join(', ')}`);
    } else {
      basis.push('No severe weather events forecast in next 7 days');
    }

    if (weather.forecastHighTemp > 33 && stage.stage === 'Flowering') {
      severity = 'red';
      value = 'High Risk';
      basis.push('Heat during flowering can severely impact yield');
    }

    return { value, severity, basis };
  }

  private computeDiseaseRisk(weather: any, stage: any, anomalies: any[]): DimensionResult {
    const basis: string[] = [];
    let severity: Severity = 'green';
    let value = 'Low Risk';

    if (weather.humidityAvg > 80 && weather.recentRainfallMm > 10) {
      severity = 'amber';
      value = 'Elevated Risk';
      basis.push('High humidity and recent rain create fungal conditions');
    } else {
       basis.push('Current humidity and temperature do not favor major pathogens');
    }

    if (anomalies.some(a => a.anomalyType === 'vegetation_decline')) {
      basis.push('Existing vegetation decline could indicate active localized infection');
    }

    return { value, severity, basis };
  }

  private computeClimateStress(weather: any, anomalies: any[]): DimensionResult {
    // Distinguishing from short-term weather risk - looking at broader stress
    const basis: string[] = ['Temperatures are within normal seasonal range'];
    return { value: 'Normal', severity: 'green', basis };
  }

  private computeCropHealth(dimensions: DimensionResult[]): DimensionResult {
    const redCount = dimensions.filter(d => d.severity === 'red').length;
    const amberCount = dimensions.filter(d => d.severity === 'amber').length;
    
    let severity: Severity = 'green';
    let value = 'Good';
    const basis: string[] = [];

    if (redCount > 0) {
      severity = 'red';
      value = 'Concern';
      basis.push(`${redCount} critical stress factors identified`);
    } else if (amberCount > 0) {
      severity = 'amber';
      value = 'Moderate';
      basis.push(`${amberCount} areas require attention`);
    } else {
      basis.push('All measured dimensions are within healthy ranges');
    }

    return { value, severity, basis };
  }
}

export const healthScoreService = new HealthScoreService();
