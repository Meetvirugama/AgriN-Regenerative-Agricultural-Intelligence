import { query, queryOne, execute } from "../connection.js";

export class WeatherRepository {
  async saveSnapshot(snapshot) {
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
        snapshot.field_id,
        snapshot.date,
        snapshot.source,
        snapshot.rainfall_mm,
        snapshot.temp_min,
        snapshot.temp_max,
        snapshot.humidity_pct,
        snapshot.forecast_confidence,
        snapshot.is_forecast,
      ],
    );
  }

  async getSnapshots(fieldId, limit = 14) {
    return query(
      `SELECT field_id, snapshot_date::text AS date, source, rainfall_mm::float,
              temp_min::float, temp_max::float, humidity_pct::float,
              forecast_confidence, is_forecast, ingested_at::text
       FROM field_weather_snapshots
       WHERE field_id = $1
       ORDER BY snapshot_date DESC
       LIMIT $2`,
      [fieldId, limit],
    );
  }

  async getForecastsOnly(fieldId) {
    return query(
      `SELECT field_id, snapshot_date::text AS date, source, rainfall_mm::float,
              temp_min::float, temp_max::float, humidity_pct::float,
              forecast_confidence, is_forecast, ingested_at::text
       FROM field_weather_snapshots
       WHERE field_id = $1 AND is_forecast = TRUE
       ORDER BY snapshot_date ASC`,
      [fieldId],
    );
  }

  async saveFlag(flag) {
    const row = await queryOne(
      `INSERT INTO weather_event_flags
         (field_id, event_type, start_date, end_date, severity, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, field_id, event_type, start_date::text, end_date::text,
                 severity, message, generated_at::text`,
      [
        flag.field_id,
        flag.event_type,
        flag.start_date,
        flag.end_date,
        flag.severity,
        flag.message,
      ],
    );
    return row;
  }

  async getActiveFlags(fieldId) {
    return query(
      `SELECT id, field_id, event_type, start_date::text, end_date::text,
              severity, message, generated_at::text
       FROM weather_event_flags
       WHERE field_id = $1
         AND end_date >= CURRENT_DATE
       ORDER BY generated_at DESC`,
      [fieldId],
    );
  }

  /**
   * Get recent HISTORICAL (non-forecast) weather snapshots oldest-first.
   * Used by crop.service.js to build the temperature history for GDD calculation.
   * @param {string} fieldId
   * @param {number} days - how many days back to look
   */
  async getRecentSnapshots(fieldId, days = 90) {
    return query(
      `SELECT field_id, snapshot_date::text AS date, temp_min::float, temp_max::float
       FROM field_weather_snapshots
       WHERE field_id = $1
         AND is_forecast = FALSE
         AND snapshot_date >= CURRENT_DATE - ($2 || ' days')::interval
       ORDER BY snapshot_date ASC`,
      [fieldId, days],
    );
  }

  async deleteStaleForecastsOlderThan(fieldId, days = 2) {
    await execute(
      `DELETE FROM field_weather_snapshots
       WHERE field_id = $1 AND is_forecast = TRUE
         AND snapshot_date < CURRENT_DATE - $2::interval`,
      [fieldId, `${days} days`],
    );
  }
}

export const weatherRepo = new WeatherRepository();
