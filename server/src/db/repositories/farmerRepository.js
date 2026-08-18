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
      `SELECT id, phone_number, name, preferred_language, created_at::text
       FROM farmers WHERE id = $1`,
      [id],
    );
    return row;
  }

  async findFarmerByPhone(phone) {
    return queryOne(
      `SELECT id, phone_number, name, preferred_language, created_at::text
       FROM farmers WHERE phone_number = $1`,
      [phone],
    );
  }

  async findFarmerByEmail(email) {
    return queryOne(
      `SELECT id, phone_number, name, preferred_language, email, password_hash, created_at::text
       FROM farmers WHERE email = $1`,
      [email],
    );
  }

  async upsertFarmer(farmer) {
    const row = await queryOne(
      `INSERT INTO farmers (id, phone_number, name, preferred_language)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone_number) DO UPDATE
         SET name = EXCLUDED.name,
             preferred_language = EXCLUDED.preferred_language
       RETURNING id, phone_number, name, preferred_language, created_at::text`,
      [farmer.id, farmer.phone_number, farmer.name, farmer.preferred_language],
    );
    return row;
  }
}

export class FieldRepository {
  /**
   * Select clause that extracts lat/lng from the PostGIS centroid column.
   * Falls back to the legacy lat/lng float columns if centroid is null.
   */
  #SELECT_FIELDS = `
    id, farmer_id, name, crop_type, crop_variety, irrigation_type,
    sowing_date::text, created_at::text, updated_at::text,
    location_name, area_hectares, boundary_geojson,
    COALESCE(ST_Y(centroid), lat) AS lat,
    COALESCE(ST_X(centroid), lng) AS lng,
    CASE WHEN geometry IS NOT NULL THEN ST_AsGeoJSON(geometry)::jsonb ELSE boundary_geojson END AS geojson
  `;

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

  async upsertField(field) {
    // Build geometry + centroid from boundaryGeojson if provided
    const hasPolygon = field.boundary_geojson != null;
    const row = await queryOne(
      `INSERT INTO fields
         (id, farmer_id, name, crop_type, crop_variety, sowing_date,
          lat, lng, location_name, area_hectares, boundary_geojson,
          geometry, centroid)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          ${hasPolygon ? "ST_GeomFromGeoJSON($12)" : "NULL"},
          ${hasPolygon ? "ST_Centroid(ST_GeomFromGeoJSON($12))" : "CASE WHEN $7::float IS NOT NULL THEN ST_SetSRID(ST_MakePoint($8::float,$7::float),4326) ELSE NULL END"})
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
             geometry = EXCLUDED.geometry,
             centroid = EXCLUDED.centroid,
             updated_at = NOW()
       RETURNING ${this.#SELECT_FIELDS}`,
      [
        field.id, field.farmer_id, field.name, field.crop_type,
        field.crop_variety, field.sowing_date,
        field.lat, field.lng, field.location_name, field.area_hectares,
        hasPolygon ? JSON.stringify(field.boundary_geojson) : null,
        ...(hasPolygon ? [JSON.stringify(field.boundary_geojson)] : []),
      ],
    );
    return row;
  }

  async createField(farmerId, name, cropType, sowingDate, cropVariety, lat, lng, locationName, areaHectares, boundaryGeojson, irrigationType) {
    const hasPolygon = boundaryGeojson != null;
    const geojsonStr = hasPolygon ? JSON.stringify(boundaryGeojson) : null;
    const row = await queryOne(
      `INSERT INTO fields
         (farmer_id, name, crop_type, crop_variety, sowing_date,
          lat, lng, location_name, area_hectares, boundary_geojson,
          irrigation_type, geometry, centroid)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          ${hasPolygon ? "ST_GeomFromGeoJSON($12)" : "NULL"},
          ${hasPolygon
            ? "ST_Centroid(ST_GeomFromGeoJSON($12))"
            : "CASE WHEN $6::float IS NOT NULL THEN ST_SetSRID(ST_MakePoint($7::float,$6::float),4326) ELSE NULL END"})
       RETURNING ${this.#SELECT_FIELDS}`,
      [
        farmerId, name, cropType, cropVariety ?? null, sowingDate,
        lat, lng, locationName, areaHectares, geojsonStr,
        irrigationType ?? null,
        ...(hasPolygon ? [geojsonStr] : []),
      ],
    );
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
