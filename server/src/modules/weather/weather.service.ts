import { FieldWeatherSnapshot, WeatherEventFlag } from '../../models/Database';
import { IWeatherProvider } from './WeatherProvider';
import { createWeatherProvider } from './OpenMeteoProvider';
import { WeatherRuleEngine } from './WeatherRuleEngine';
import { layer1Service } from '../field/field.service';
import { weatherRepo } from '../../db/repositories/weatherRepository';

const CACHE_TTL_HOURS = 6; // Serve cached forecast if < 6 hours old

class Layer3Service {
  private provider: IWeatherProvider;
  private ruleEngine: WeatherRuleEngine;

  constructor() {
    this.provider = createWeatherProvider();
    this.ruleEngine = new WeatherRuleEngine();
  }

  /**
   * Fetch forecast from Open-Meteo and persist to Postgres.
   * Also evaluates rule engine and persists any weather event flags.
   */
  public async fetchAndStoreForecast(
    fieldId: string
  ): Promise<{ forecasts: FieldWeatherSnapshot[]; flags: WeatherEventFlag[] }> {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    // Fetch from API (lat/lng default to Punjab if field has no coordinates yet)
    const forecasts = await this.provider.getForecast(
      (field as any).lat ?? 0,
      (field as any).lng ?? 0,
      fieldId
    );

    // Persist each forecast snapshot (upserts on conflict)
    for (const snapshot of forecasts) {
      await weatherRepo.saveSnapshot(snapshot);
    }

    // Purge stale forecasts (> 2 days old)
    await weatherRepo.deleteStaleForecastsOlderThan(fieldId, 2);

    // Evaluate rules and persist flags
    const flags = this.ruleEngine.evaluate(fieldId, forecasts);
    for (const flag of flags) {
      await weatherRepo.saveFlag({
        field_id: flag.field_id,
        event_type: flag.event_type,
        start_date: flag.start_date,
        end_date: flag.end_date,
        severity: flag.severity,
        message: flag.message,
      });
    }

    return { forecasts, flags };
  }

  /**
   * Returns the cached forecast from Postgres.
   * If the cache is empty or stale (> 6 hours), fetches fresh data first.
   */
  public async getLocalizedForecast(
    fieldId: string
  ): Promise<{ forecasts: FieldWeatherSnapshot[]; flags: WeatherEventFlag[] }> {
    const cached = await weatherRepo.getForecastsOnly(fieldId);

    const isStale =
      cached.length === 0 ||
      !cached[0]?.ingested_at ||
      (Date.now() - new Date(cached[0].ingested_at).getTime()) > CACHE_TTL_HOURS * 3600 * 1000;

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
  public async getFieldWeatherHistory(fieldId: string): Promise<FieldWeatherSnapshot[]> {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    const history = await this.provider.getHistory(
      (field as any).lat ?? 0,
      (field as any).lng ?? 0,
      fieldId
    );

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
  public async getCachedHistory(fieldId: string, days = 14): Promise<FieldWeatherSnapshot[]> {
    return weatherRepo.getSnapshots(fieldId, days);
  }
}

export const layer3Service = new Layer3Service();

