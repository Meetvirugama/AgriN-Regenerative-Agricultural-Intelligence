import { query, queryOne, execute } from "../connection.js";

/**
 * FarmerRepository
 *
 * All database operations for farmer and field records.
 * These replace the InMemoryDB.farmers and InMemoryDB.fields Maps.
 */
export class FarmerRepository {
  async findFarmerById(id) {
    const row = await queryOne(
      `SELECT id, phone_number, name, preferred_language, email, location, profile_image_url, farming_experience_years, created_at::text
       FROM farmers WHERE id = $1`,
      [id],
    );
    return row;
  }

  async findFarmerByPhone(phone) {
    const row = await queryOne(
      `SELECT id, phone_number, name, preferred_language, email, location, profile_image_url, farming_experience_years, created_at::text
       FROM farmers WHERE phone_number = $1`,
      [phone],
    );
    return row;
  }

  async findFarmerByEmail(email) {
    const row = await queryOne(
      `SELECT id, phone_number, name, preferred_language, email, location, profile_image_url, farming_experience_years, password_hash, created_at::text
       FROM farmers WHERE email = $1`,
      [email],
    );
    return row;
  }

  async upsertFarmer(farmer) {
    const row = await queryOne(
      `INSERT INTO farmers (id, phone_number, name, preferred_language, email, location, profile_image_url, farming_experience_years)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             preferred_language = EXCLUDED.preferred_language,
             phone_number = COALESCE(EXCLUDED.phone_number, farmers.phone_number),
             email = COALESCE(EXCLUDED.email, farmers.email),
             location = COALESCE(EXCLUDED.location, farmers.location),
             profile_image_url = COALESCE(EXCLUDED.profile_image_url, farmers.profile_image_url),
             farming_experience_years = COALESCE(EXCLUDED.farming_experience_years, farmers.farming_experience_years)
       RETURNING id, phone_number, name, preferred_language, email, location, profile_image_url, farming_experience_years, created_at::text`,
      [
        farmer.id, 
        farmer.phone_number ?? null, 
        farmer.name, 
        farmer.preferred_language,
        farmer.email ?? null,
        farmer.location ?? null,
        farmer.profile_image_url ?? null,
        farmer.farming_experience_years ?? null
      ],
    );
    return row;
  }

  async createFarmerWithPassword({ id, name, email, phone_number, password_hash, preferred_language }) {
    const row = await queryOne(
      `INSERT INTO farmers (id, name, email, phone_number, password_hash, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, phone_number, name, preferred_language, email, location, profile_image_url, farming_experience_years, created_at::text`,
      [id, name, email, phone_number, password_hash, preferred_language]
    );
    return row;
  }

  async updatePassword(farmerId, newPasswordHash) {
    await execute(
      `UPDATE farmers SET password_hash = $2 WHERE id = $1`,
      [farmerId, newPasswordHash]
    );
  }
}

export class FieldRepository {
  /**
   * Select clause — uses simple lat/lng floats to avoid PostGIS dependency.
   * PostGIS geometry columns are updated asynchronously after insert.
   */
  #SELECT_FIELDS = `id, farmer_id, name, crop_type, crop_variety,
                    sowing_date::text, lat, lng, created_at::text, updated_at::text,
                    location_name, area_hectares, irrigation_type,
                    soil_type, previous_crop, tillage_method, seed_rate, target_yield, description,
                    boundary_geojson AS geojson`;

  async findFieldById(id) {
    return queryOne(
      `SELECT ${this.#SELECT_FIELDS} FROM fields WHERE id = $1`,
      [id],
    );
  }

  async findFieldsByFarmer(farmerId) {
    return query(
      `SELECT ${this.#SELECT_FIELDS}
       FROM fields WHERE farmer_id = $1
       ORDER BY created_at ASC`,
      [farmerId],
    );
  }

  /**
   * Return ALL fields across all farmers — used by background jobs
   * (e.g., nightly stage recompute) that must process every field.
   */
  async findAllFields() {
    return query(
      `SELECT ${this.#SELECT_FIELDS}
       FROM fields
       ORDER BY created_at ASC`,
    );
  }

  async upsertField(field) {
    // Plain INSERT without PostGIS geometry columns — works on any PostgreSQL instance
    const row = await queryOne(
      `INSERT INTO fields
         (id, farmer_id, name, crop_type, crop_variety, sowing_date,
          lat, lng, location_name, area_hectares, boundary_geojson, irrigation_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             crop_type = EXCLUDED.crop_type,
             crop_variety = EXCLUDED.crop_variety,
             sowing_date = EXCLUDED.sowing_date,
             lat = EXCLUDED.lat,
             lng = EXCLUDED.lng,
             location_name = EXCLUDED.location_name,
             area_hectares = EXCLUDED.area_hectares,
             boundary_geojson = EXCLUDED.boundary_geojson,
             irrigation_type = COALESCE(EXCLUDED.irrigation_type, fields.irrigation_type),
             updated_at = NOW()
       RETURNING ${this.#SELECT_FIELDS}`,
      [
        field.id, field.farmer_id, field.name, field.crop_type,
        field.crop_variety ?? null, field.sowing_date,
        field.lat ?? null, field.lng ?? null, field.location_name ?? null,
        field.area_hectares ?? null,
        field.boundary_geojson ? JSON.stringify(field.boundary_geojson) : null,
        field.irrigation_type ?? null,
      ],
    );
    return row;
  }

  async updateField(fieldId, { name, cropType, cropVariety, sowingDate, irrigationType, soilType, previousCrop, tillageMethod, seedRate, targetYield, description }) {
    return queryOne(
      `UPDATE fields
       SET name = COALESCE($2, name),
           crop_type = COALESCE($3, crop_type),
           crop_variety = COALESCE($4, crop_variety),
           sowing_date = COALESCE($5::date, sowing_date),
           irrigation_type = COALESCE($6, irrigation_type),
           soil_type = COALESCE($7, soil_type),
           previous_crop = COALESCE($8, previous_crop),
           tillage_method = COALESCE($9, tillage_method),
           seed_rate = COALESCE($10, seed_rate),
           target_yield = COALESCE($11, target_yield),
           description = COALESCE($12, description),
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${this.#SELECT_FIELDS}`,
      [fieldId, name ?? null, cropType ?? null, cropVariety ?? null, sowingDate ?? null, irrigationType ?? null, soilType ?? null, previousCrop ?? null, tillageMethod ?? null, seedRate ?? null, targetYield ?? null, description ?? null],
    );
  }

  async deleteField(fieldId) {
    await execute(`DELETE FROM fields WHERE id = $1`, [fieldId]);
  }

  async createField(farmerId, name, cropType, sowingDate, cropVariety, lat, lng, locationName, areaHectares, boundaryGeojson, irrigationType, soilType, previousCrop, tillageMethod, seedRate, targetYield, description) {
    const geojsonStr = boundaryGeojson ? JSON.stringify(boundaryGeojson) : null;
    // Base INSERT — no PostGIS functions, works on any PostgreSQL instance
    const row = await queryOne(
      `INSERT INTO fields
         (farmer_id, name, crop_type, crop_variety, sowing_date,
          lat, lng, location_name, area_hectares, boundary_geojson, irrigation_type,
          soil_type, previous_crop, tillage_method, seed_rate, target_yield, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING ${this.#SELECT_FIELDS}`,
      [
        farmerId, name, cropType, cropVariety ?? null, sowingDate,
        lat ?? null, lng ?? null, locationName ?? null,
        areaHectares ?? null, geojsonStr, irrigationType ?? null,
        soilType ?? null, previousCrop ?? null, tillageMethod ?? null, seedRate ?? null, targetYield ?? null, description ?? null,
      ],
    );
    // Best-effort PostGIS update — silently skipped if extension is not installed
    if (row?.id) {
      try {
        if (geojsonStr) {
          // ST_GeomFromGeoJSON expects a Geometry, not a Feature.
          // Extract the geometry part if it's a Feature.
          const geomStr = boundaryGeojson?.type === 'Feature' && boundaryGeojson.geometry 
            ? JSON.stringify(boundaryGeojson.geometry) 
            : geojsonStr;
            
          await execute(
            `UPDATE fields
             SET geometry = ST_GeomFromGeoJSON($1),
                 centroid = ST_Centroid(ST_GeomFromGeoJSON($1))
             WHERE id = $2`,
            [geomStr, row.id],
          );
        } else if (lat != null && lng != null) {
          await execute(
            `UPDATE fields
             SET centroid = ST_SetSRID(ST_MakePoint($1::float, $2::float), 4326)
             WHERE id = $3`,
            [lng, lat, row.id],
          );
        }
      } catch (_postgisErr) {
        // PostGIS not installed — geometry stays null, field still usable
        console.warn('[DB] PostGIS geometry update skipped (extension not available)');
      }
    }
    return row;
  }
}

export class CropStateRepository {
  async getCropState(fieldId) {
    return queryOne(
      `SELECT field_id, confirmed_crop, confirmed_variety, current_stage,
              stage_description, stage_confidence, stage_conflict,
              accumulated_gdd::float, last_updated_from, updated_at::text
       FROM field_crop_states WHERE field_id = $1`,
      [fieldId],
    );
  }

  async upsertCropState(state) {
    await execute(
      `INSERT INTO field_crop_states
         (field_id, confirmed_crop, confirmed_variety, current_stage,
          stage_description, stage_confidence, stage_conflict,
          accumulated_gdd, last_updated_from, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (field_id) DO UPDATE SET
         confirmed_crop = EXCLUDED.confirmed_crop,
         confirmed_variety = EXCLUDED.confirmed_variety,
         current_stage = EXCLUDED.current_stage,
         stage_description = EXCLUDED.stage_description,
         stage_confidence = EXCLUDED.stage_confidence,
         stage_conflict = EXCLUDED.stage_conflict,
         accumulated_gdd = EXCLUDED.accumulated_gdd,
         last_updated_from = EXCLUDED.last_updated_from,
         updated_at = NOW()`,
      [
        state.field_id,
        state.confirmed_crop,
        state.confirmed_variety,
        state.current_stage,
        state.stage_description,
        state.stage_confidence,
        state.stage_conflict,
        state.accumulated_gdd,
        state.last_updated_from,
      ],
    );
  }

  async getCropCalendar(cropType, region) {
    return queryOne(
      `SELECT id, crop_type, region, stages
       FROM crop_calendars
       WHERE crop_type = $1 AND region = $2`,
      [cropType, region],
    );
  }

  async getAllCropCalendars() {
    return query("SELECT id, crop_type, region, stages FROM crop_calendars");
  }
}

export const farmerRepo = new FarmerRepository();
export const fieldRepo = new FieldRepository();
export const cropStateRepo = new CropStateRepository();
