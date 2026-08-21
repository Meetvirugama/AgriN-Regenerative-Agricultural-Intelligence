import { query } from "../../db/connection.js";
import { healthScoreService } from "../health-score/health-score.service.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { generateIntelligenceRecommendations } from "./intelligence.ai.js";
import { settingsService } from "../settings/settings.service.js";

const round = (value, digits = 0) => {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const average = (values) => {
  const valid = values.map(Number).filter(Number.isFinite);
  if (!valid.length) {
    return null;
  }
  return round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const getHealthDistribution = (scores) => {
  const valid = scores.filter(
    (score) => Number.isFinite(score) && score >= 0 && score <= 100
  );
  if (!valid.length) {
    return { good: 0, moderate: 0, poor: 0, total: 0 };
  }
  const good = valid.filter((score) => score >= 70).length;
  const moderate = valid.filter((score) => score >= 40 && score < 70).length;
  const poor = valid.filter((score) => score < 40).length;

  return {
    good: round((good / valid.length) * 100),
    moderate: round((moderate / valid.length) * 100),
    poor: round((poor / valid.length) * 100),
    total: valid.length,
  };
};

const getFields = async (farmerId) => {
  const result = await query(
    `
    SELECT 
      id, name, crop_type, crop_variety, sowing_date::text, 
      lat as latitude, lng as longitude, area_hectares, irrigation_type, created_at
    FROM fields
    WHERE farmer_id = $1
    ORDER BY created_at ASC
    `,
    [farmerId]
  );
  return result.rows;
};

const getAlerts = async (farmerId) => {
  const result = await query(
    `
    SELECT id, title, priority, type, field_id, created_at
    FROM alerts
    WHERE farmer_id = $1 AND resolved = false
    ORDER BY 
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      created_at DESC
    `,
    [farmerId]
  );
  return result.rows;
};

const getFieldHealth = async (fields) => {
  /**
   * Parallel instead of sequential.
   * We do NOT return a fake score when computation fails.
   */
  return Promise.all(
    fields.map(async (field) => {
      try {
        const result = await healthScoreService.computeScore(field.id);
        const score = Number(result?.score);

        if (!Number.isFinite(score) || score < 0 || score > 100) {
          return {
            fieldId: field.id,
            score: null,
            available: false,
            error: "Invalid health score.",
          };
        }

        return {
          fieldId: field.id,
          score: round(score),
          available: true,
          dimensions: result?.components ?? null,
          category: result?.category ?? null,
          confidence: result?.confidence ?? null,
          calculatedAt: result?.computedAt ?? new Date().toISOString(),
        };
      } catch (error) {
        console.warn(
          `[Intelligence] Health calculation failed for ${field.id}:`,
          error.message
        );
        return {
          fieldId: field.id,
          score: null,
          available: false,
          error: error.message,
        };
      }
    })
  );
};

const getFieldWeather = async (fields) => {
  /**
   * Weather is field-specific.
   * Do NOT use the first field as a farm-wide proxy.
   */
  const results = await Promise.all(
    fields.map(async (field) => {
      try {
        const snapshots = await weatherRepo.getSnapshots(field.id, 14);

        const sorted = [...snapshots].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const current = sorted.find((snapshot) => !snapshot.is_forecast) ?? null;

        const forecasts = sorted
          .filter((snapshot) => snapshot.is_forecast)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, 7);

        return {
          fieldId: field.id,
          available: Boolean(current || forecasts.length),
          current: current
            ? {
                date: current.date,
                tempMax: current.temp_max ?? null,
                tempMin: current.temp_min ?? null,
                humidity: current.humidity_pct ?? null,
                rainfallMm: current.rainfall_mm ?? null,
                // Use DB value if available. NEVER invent 12 km/h.
                windSpeed: current.wind_speed ?? null,
              }
            : null,
          forecasts: forecasts.map((forecast) => ({
            date: forecast.date,
            tempMax: forecast.temp_max ?? null,
            tempMin: forecast.temp_min ?? null,
            humidity: forecast.humidity_pct ?? null,
            rainfallMm: forecast.rainfall_mm ?? null,
            windSpeed: forecast.wind_speed ?? null,
          })),
        };
      } catch (error) {
        console.warn(
          `[Intelligence] Weather failed for ${field.id}:`,
          error.message
        );
        return {
          fieldId: field.id,
          available: false,
          current: null,
          forecasts: [],
          error: error.message,
        };
      }
    })
  );
  return results;
};

const buildRealTrend = async (fields) => {
  /**
   * NEVER simulate historical health.
   * This uses real historical health observations.
   */
  if (!fields.length) {
    return [];
  }

  const fieldIds = fields.map((field) => field.id);

  const result = await query(
    `
    SELECT 
      field_id,
      DATE(observed_at) AS date,
      AVG(score) AS score
    FROM field_health_history
    WHERE field_id = ANY($1::uuid[])
      AND observed_at >= NOW() - INTERVAL '7 days'
    GROUP BY field_id, DATE(observed_at)
    ORDER BY date ASC
    `,
    [fieldIds]
  );

  /**
   * Aggregate across actual field observations.
   */
  const groupedAll = new Map();
  const groupedByField = {};

  for (const row of result.rows) {
    // Note: row.date might be a Date object or string depending on pg config.
    // Ensure we format it to string (YYYY-MM-DD) for consistency
    const dateStr = typeof row.date === 'string' ? row.date.split('T')[0] : row.date.toISOString().split('T')[0];
    
    if (!groupedAll.has(dateStr)) {
      groupedAll.set(dateStr, []);
    }
    groupedAll.get(dateStr).push(Number(row.score));

    if (!groupedByField[row.field_id]) {
      groupedByField[row.field_id] = new Map();
    }
    if (!groupedByField[row.field_id].has(dateStr)) {
      groupedByField[row.field_id].set(dateStr, []);
    }
    groupedByField[row.field_id].get(dateStr).push(Number(row.score));
  }

  const farmTrend = Array.from(groupedAll.entries()).map(([dateStr, values]) => ({
    date: dateStr,
    value: average(values),
  }));

  const fieldTrends = {};
  for (const [fieldId, dateMap] of Object.entries(groupedByField)) {
    fieldTrends[fieldId] = Array.from(dateMap.entries()).map(([dateStr, values]) => ({
      date: dateStr,
      value: average(values),
    }));
  }

  return { farmTrend, fieldTrends };
};

export const intelligenceService = {
  async getFarmerIntelligence(farmerId) {
    const [fields, alerts, settings] = await Promise.all([
      getFields(farmerId),
      getAlerts(farmerId),
      settingsService.getSettings(farmerId),
    ]);

    if (!fields.length) {
      return {
        stats: {
          totalFields: 0,
          avgHealth: null,
          activeAlerts: alerts.length,
          recommendations: 0,
        },
        healthDistribution: {
          good: 0,
          moderate: 0,
          poor: 0,
          total: 0,
        },
        fields: [],
        topRecommendations: [],
        trendData: [],
        weatherData: [],
        meta: {
          generatedAt: new Date().toISOString(),
          dataQuality: "no_field",
        },
      };
    }

    const [healthResults, weatherResults, trends] = await Promise.all([
      getFieldHealth(fields),
      getFieldWeather(fields),
      buildRealTrend(fields),
    ]);

    const healthByField = new Map(
      healthResults.map((item) => [item.fieldId, item])
    );

    const validScores = healthResults
      .map((item) => item.score)
      .filter(Number.isFinite);

    const avgHealth = average(validScores);
    const healthDistribution = getHealthDistribution(validScores);

    const fieldData = fields.map((field) => ({
      id: field.id,
      name: field.name,
      crop: {
        type: field.crop_type,
        variety: field.crop_variety ?? null,
        sowingDate: field.sowing_date ?? null,
      },
      areaHectares: field.area_hectares ?? null,
      irrigationSource: field.irrigation_type ?? null,
      health: healthByField.get(field.id) ?? {
        score: null,
        available: false,
      },
      weather: weatherResults.find((item) => item.fieldId === field.id) ?? {
        available: false,
        current: null,
        forecasts: [],
      },
    }));

    // If personalizedRecs is disabled, don't pass the fields and alerts array
    let aiContext = {
      fields: fieldData,
      activeAlerts: alerts.map((alert) => ({
        id: alert.id,
        fieldId: alert.field_id,
        title: alert.title,
        priority: alert.priority,
        type: alert.type,
        createdAt: alert.created_at,
      })),
      health: {
        average: avgHealth,
        distribution: healthDistribution,
      },
      trend: trends.farmTrend,
    };

    if (settings && !settings.personalizedRecs) {
      aiContext = {
        fields: [],
        activeAlerts: [],
        health: null,
        trend: [],
        message: "Personalized recommendations disabled by farmer settings.",
      };
    } else if (settings) {
      // Respect individual permissions
      if (settings?.permissions?.weather === false) {
        aiContext.fields.forEach(f => f.weather = null);
      }
      if (settings?.permissions?.health === false) {
        aiContext.health = null;
        aiContext.trend = null;
        aiContext.fields.forEach(f => f.health = null);
      }
      if (settings?.permissions?.crop === false) {
        aiContext.fields.forEach(f => f.crop = null);
      }
      if (settings?.permissions?.irrigation === false) {
        aiContext.fields.forEach(f => f.irrigationSource = null);
      }
      if (settings?.permissions?.history === false) {
        // history pruning
      }
    }

    const topRecommendations = await generateIntelligenceRecommendations(
      aiContext,
      settings
    );

    return {
      stats: {
        totalFields: fields.length,
        // null means there is no real health data. Never return fake 50.
        avgHealth,
        activeAlerts: alerts.length,
        recommendations: topRecommendations.length,
      },
      healthDistribution,
      fields: fieldData,
      topRecommendations,
      trendData: trends.farmTrend,
      trendDataByField: trends.fieldTrends,
      weatherData: weatherResults,
      meta: {
        generatedAt: new Date().toISOString(),
        dataQuality:
          validScores.length === fields.length
            ? "complete"
            : validScores.length > 0
            ? "partial"
            : "unavailable",
      },
    };
  },
};
