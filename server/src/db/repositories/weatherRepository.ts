import { query, queryOne, execute } from '../connection';
import { FieldWeatherSnapshot, WeatherEventFlag } from '../../models/Database';

export class WeatherRepository {
  async saveSnapshot(snapshot: Omit<FieldWeatherSnapshot, 'ingested_at'>): Promise<void> {
    await execute(
      `INSERT INTO field_weather_snapshots
         (field_id, snapshot_date, source, rainfall_mm, temp_min, temp_max,
          humidity_pct, forecast_confidence, is_forecast)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (field_id, snapshot_date, is_forecast) DO UPDATE SET
         source = EXCLUDED.source,
         rainfall_mm = EXCLUDED.rainfall_mm,
         temp_min = EXCLUDED.temp_min,
         temp_max = EXCLUDED.temp_max,
         humidity_pct = EXCLUDED.humidity_pct,
         forecast_confidence = EXCLUDED.forecast_confidence,
         ingested_at = NOW()`,
      [
        snapshot.field_id, snapshot.date, snapshot.source,
        snapshot.rainfall_mm, snapshot.temp_min, snapshot.temp_max,
        snapshot.humidity_pct, snapshot.forecast_confidence, snapshot.is_forecast
      ]
    );
  }

  async getSnapshots(fieldId: string, limit = 14): Promise<FieldWeatherSnapshot[]> {
    return query<FieldWeatherSnapshot>(
      `SELECT field_id, snapshot_date::text AS date, source, rainfall_mm::float,
              temp_min::float, temp_max::float, humidity_pct::float,
              forecast_confidence, is_forecast, ingested_at::text
       FROM field_weather_snapshots
       WHERE field_id = $1
       ORDER BY snapshot_date DESC
       LIMIT $2`,
      [fieldId, limit]
    );
  }

  async getForecastsOnly(fieldId: string): Promise<FieldWeatherSnapshot[]> {
    return query<FieldWeatherSnapshot>(
      `SELECT field_id, snapshot_date::text AS date, source, rainfall_mm::float,
              temp_min::float, temp_max::float, humidity_pct::float,
              forecast_confidence, is_forecast, ingested_at::text
       FROM field_weather_snapshots
       WHERE field_id = $1 AND is_forecast = TRUE
       ORDER BY snapshot_date ASC`,
      [fieldId]
    );
  }

  async saveFlag(flag: Omit<WeatherEventFlag, 'id' | 'generated_at'>): Promise<WeatherEventFlag> {
    const row = await queryOne<WeatherEventFlag>(
      `INSERT INTO weather_event_flags
         (field_id, event_type, start_date, end_date, severity, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, field_id, event_type, start_date::text, end_date::text,
                 severity, message, generated_at::text`,
      [flag.field_id, flag.event_type, flag.start_date, flag.end_date, flag.severity, flag.message]
    );
    return row!;
  }

  async getActiveFlags(fieldId: string): Promise<WeatherEventFlag[]> {
    return query<WeatherEventFlag>(
      `SELECT id, field_id, event_type, start_date::text, end_date::text,
              severity, message, generated_at::text
       FROM weather_event_flags
       WHERE field_id = $1
         AND end_date >= CURRENT_DATE
       ORDER BY generated_at DESC`,
      [fieldId]
    );
  }

  async deleteStaleForecastsOlderThan(fieldId: string, days = 2): Promise<void> {
    await execute(
      `DELETE FROM field_weather_snapshots
       WHERE field_id = $1 AND is_forecast = TRUE
         AND snapshot_date < CURRENT_DATE - $2::interval`,
      [fieldId, `${days} days`]
    );
  }
}

export const weatherRepo = new WeatherRepository();
