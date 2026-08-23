import { query, queryOne, execute } from "../connection.js";

export class SoilRepository {
  /**
   * Find the most recent soil profile for a field.
   */
  async findLatestProfile(fieldId) {
    return queryOne(
      `SELECT id, field_id, source, texture,
              organic_matter_pct::float, nitrogen_level, phosphorus_level,
              potassium_level, water_holding_capacity, ph::float,
              report_date::text, raw_document_url, summary_text,
              created_at::text
       FROM soil_profiles
       WHERE field_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [fieldId],
    );
  }

  /**
   * Find SoilGrids-sourced profile fetched within the last N days.
   * Soil data is stable — no need to re-fetch more than once a month.
   */
  async findRecentSoilGridsProfile(fieldId, withinDays = 30) {
    return queryOne(
      `SELECT id, field_id, source, texture,
              organic_matter_pct::float, nitrogen_level, phosphorus_level,
              potassium_level, water_holding_capacity, ph::float,
              report_date::text, created_at::text
       FROM soil_profiles
       WHERE field_id = $1
         AND source = 'soilgrids'
         AND created_at > NOW() - make_interval(days => $2::int)
       ORDER BY created_at DESC
       LIMIT 1`,
      [fieldId, withinDays],
    );
  }

  /**
   * Save a new soil profile (from SoilGrids, lab report, or regional baseline).
   */
  async saveProfile(profile) {
    return queryOne(
      `INSERT INTO soil_profiles
         (field_id, source, texture, organic_matter_pct, nitrogen_level,
          phosphorus_level, potassium_level, water_holding_capacity,
          ph, report_date, raw_document_url, summary_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, field_id, source, texture,
                 organic_matter_pct::float, nitrogen_level, phosphorus_level,
                 potassium_level, water_holding_capacity, ph::float,
                 report_date::text, created_at::text`,
      [
        profile.field_id,
        profile.source,
        profile.texture,
        profile.organic_matter_pct ?? 0,
        profile.nitrogen_level ?? "medium",
        profile.phosphorus_level ?? "medium",
        profile.potassium_level ?? "medium",
        profile.water_holding_capacity ?? "medium",
        profile.ph ?? 7.0,
        profile.report_date ?? new Date().toISOString().split("T")[0],
        profile.raw_document_url ?? null,
        profile.summary_text ?? null,
      ],
    );
  }

  /**
   * Look up a seeded regional baseline (Punjab, Maharashtra, Karnataka, etc.)
   */
  async findRegionalBaseline(region) {
    return queryOne(
      `SELECT region_id, texture, avg_organic_matter::float AS organic_matter_pct,
              avg_nitrogen AS nitrogen_level, avg_phosphorus AS phosphorus_level,
              avg_potassium AS potassium_level, avg_ph::float AS ph,
              water_holding_capacity
       FROM regional_soil_baselines
       WHERE region_id = $1`,
      [region],
    );
  }
}

export const soilRepo = new SoilRepository();
