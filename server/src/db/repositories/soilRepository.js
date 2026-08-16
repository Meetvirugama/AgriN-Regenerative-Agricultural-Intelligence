import { query, queryOne } from "../connection.js";

export class SoilRepository {
  async getLatestProfile(fieldId) {
    return queryOne(
      `SELECT id, field_id, source, texture, organic_matter_pct::float,
              nitrogen_level, phosphorus_level, potassium_level,
              water_holding_capacity, ph::float, report_date::text,
              raw_document_url, summary_text, created_at::text
       FROM soil_profiles
       WHERE field_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [fieldId],
    );
  }

  async getProfileHistory(fieldId) {
    return query(
      `SELECT id, field_id, source, texture, organic_matter_pct::float,
              nitrogen_level, phosphorus_level, potassium_level,
              water_holding_capacity, ph::float, report_date::text,
              raw_document_url, summary_text, created_at::text
       FROM soil_profiles
       WHERE field_id = $1
       ORDER BY created_at DESC`,
      [fieldId],
    );
  }

  async insertProfile(profile) {
    const row = await queryOne(
      `INSERT INTO soil_profiles
         (field_id, source, texture, organic_matter_pct, nitrogen_level,
          phosphorus_level, potassium_level, water_holding_capacity,
          ph, report_date, raw_document_url, summary_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, field_id, source, texture, organic_matter_pct::float,
                 nitrogen_level, phosphorus_level, potassium_level,
                 water_holding_capacity, ph::float, report_date::text,
                 raw_document_url, summary_text, created_at::text`,
      [
        profile.field_id,
        profile.source,
        profile.texture,
        profile.organic_matter_pct,
        profile.nitrogen_level,
        profile.phosphorus_level,
        profile.potassium_level,
        profile.water_holding_capacity,
        profile.ph,
        profile.report_date,
        profile.raw_document_url ?? null,
        profile.summary_text ?? null,
      ],
    );
    return row;
  }

  async getRegionalBaseline(regionId) {
    const row = await queryOne(
      `SELECT region_id, texture, avg_organic_matter::float,
              avg_nitrogen, avg_phosphorus, avg_potassium, avg_ph::float,
              water_holding_capacity
       FROM regional_soil_baselines
       WHERE region_id = $1`,
      [regionId],
    );
    if (!row) return null;
    return {
      region_id: row.region_id,
      texture: row.texture,
      avg_organic_matter: row.avg_organic_matter,
      avg_npk: {
        n: row.avg_nitrogen,
        p: row.avg_phosphorus,
        k: row.avg_potassium,
      },
      avg_ph: row.avg_ph,
      water_holding_capacity: row.water_holding_capacity,
    };
  }
}

export const soilRepo = new SoilRepository();
