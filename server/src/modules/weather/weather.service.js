import { createWeatherProvider } from "./openMeteo.provider.js";
import { WeatherRuleEngine } from "./weather.rules.js";
import { layer1Service } from "../field/field.service.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { execute } from "../../db/connection.js";

const CACHE_TTL_HOURS = 6; // Serve cached forecast if < 6 hours old

class Layer3Service {
  constructor() {
    this.provider = createWeatherProvider();
    this.ruleEngine = new WeatherRuleEngine();
  }

  /**
   * Fetch forecast from Open-Meteo and persist to Postgres.
   * Also evaluates rule engine and persists any weather event flags.
   */
  async fetchAndStoreForecast(fieldId) {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    const lat = field.lat;
    const lng = field.lng;
    if (lat == null || lng == null) {
      throw new Error(
        `Field ${fieldId} has no location coordinates. ` +
        `Add a field boundary or lat/lng before fetching weather.`
      );
    }

    // Fetch from Open-Meteo (real coordinates from PostGIS centroid)
    const forecasts = await this.provider.getForecast(lat, lng, fieldId);

    // Persist each forecast snapshot (upserts on conflict)
    // NOTE: snapshot persistence is independent of rule evaluation —
    // a Python service outage must not discard already-fetched forecast data.
    for (const snapshot of forecasts) {
      await weatherRepo.saveSnapshot(snapshot);
    }

    // Purge stale forecasts (> 2 days old)
    await weatherRepo.deleteStaleForecastsOlderThan(fieldId, 2);

    // Evaluate rules and persist flags — isolated so Python outage is non-fatal
    let flags = [];
    try {
      flags = await this.ruleEngine.evaluate(fieldId, forecasts);
      for (const flag of flags) {
        await weatherRepo.saveFlag({
          field_id: flag.field_id,
          event_type: flag.event_type,
          start_date: flag.start_date,
          end_date: flag.end_date,
          severity: flag.severity,
          message: flag.message,
        });

        // ── Bridge: also write weather flags to the farmer's alerts table ──
        // This is the only way weather events appear in the Alerts UI.
        try {
          const priority = flag.severity === "high" ? "high" : flag.severity === "medium" ? "medium" : "low";
          const alertTitle = {
            rain_expected: "🌧 Heavy Rain Expected",
            heat_event:    "🌡 Heat Stress Alert",
            frost_warning: "❄️ Frost Warning",
            humidity_spike: "💧 High Humidity Alert",
          }[flag.event_type] || "⚠️ Weather Alert";

          await execute(
            `INSERT INTO alerts
               (farmer_id, field_id, title, description, type, priority, source, confidence)
             SELECT
               f.farmer_id, f.id, $3, $4, 'weather', $5, 'weather-engine', 0.85
             FROM fields f
             WHERE f.id = $1
             ON CONFLICT DO NOTHING`,
            [
              flag.field_id,
              flag.field_id,
              alertTitle,
              flag.message,
              priority,
            ]
          );
        } catch (alertErr) {
          // Non-fatal — flag is already saved, alert write is best-effort
          console.warn(`[Weather] Could not write alert for flag ${flag.event_type}:`, alertErr.message);
        }
      }
    } catch (rulesErr) {
      console.warn(`[Weather] Rule evaluation failed for field ${fieldId} (non-fatal — snapshots already saved): ${rulesErr.message}`);
    }

    return { forecasts, flags };
  }

  /**
   * Returns the cached forecast from Postgres.
   * If the cache is empty or stale (> 6 hours), fetches fresh data first.
   */
  async getLocalizedForecast(fieldId) {
    const cached = await weatherRepo.getForecastsOnly(fieldId);

    const isStale =
      cached.length === 0 ||
      !cached[0]?.ingested_at ||
      Date.now() - new Date(cached[0].ingested_at).getTime() >
        CACHE_TTL_HOURS * 3600 * 1000;

    if (isStale) {
      return this.fetchAndStoreForecast(fieldId);
    }

    const flags = await weatherRepo.getActiveFlags(fieldId);
    return { forecasts: cached, flags };
  }

  /**
   * Fetches historical actuals from Open-Meteo and persists them.
   * Returns 30 days of historical data.
   */
  async getFieldWeatherHistory(fieldId) {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    const lat = field.lat;
    const lng = field.lng;
    if (lat == null || lng == null) {
      throw new Error(
        `Field ${fieldId} has no location coordinates. ` +
        `Add a field boundary or lat/lng before fetching weather history.`
      );
    }

    const history = await this.provider.getHistory(lat, lng, fieldId);

    // Persist historical actuals
    for (const snapshot of history) {
      await weatherRepo.saveSnapshot(snapshot);
    }

    return history;
  }

  /**
   * Returns the last N days of weather from Postgres (already persisted).
   * Faster than re-fetching from the API for most use cases.
   */
  async getCachedHistory(fieldId, days = 14) {
    return weatherRepo.getSnapshots(fieldId, days);
  }
}

export const layer3Service = new Layer3Service();
