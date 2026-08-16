import { query, queryOne, execute, transaction } from '../connection';
import { Farmer, Field } from '../../models/Database';
import { PoolClient } from 'pg';

/**
 * FarmerRepository
 *
 * All database operations for farmer and field records.
 * These replace the InMemoryDB.farmers and InMemoryDB.fields Maps.
 */
export class FarmerRepository {
  async findFarmerById(id: string): Promise<Farmer | null> {
    const row = await queryOne<Farmer>(
      `SELECT id, phone_number, name, preferred_language, created_at::text
       FROM farmers WHERE id = $1`,
      [id]
    );
    return row;
  }

  async findFarmerByPhone(phone: string): Promise<Farmer | null> {
    return queryOne<Farmer>(
      `SELECT id, phone_number, name, preferred_language, created_at::text
       FROM farmers WHERE phone_number = $1`,
      [phone]
    );
  }

  async upsertFarmer(farmer: Omit<Farmer, 'created_at'>): Promise<Farmer> {
    const row = await queryOne<Farmer>(
      `INSERT INTO farmers (id, phone_number, name, preferred_language)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone_number) DO UPDATE
         SET name = EXCLUDED.name,
             preferred_language = EXCLUDED.preferred_language
       RETURNING id, phone_number, name, preferred_language, created_at::text`,
      [farmer.id, farmer.phone_number, farmer.name, farmer.preferred_language]
    );
    return row!;
  }
}

export class FieldRepository {
  async findFieldById(id: string): Promise<Field | null> {
    return queryOne<Field>(
      `SELECT id, farmer_id, name, crop_type, crop_variety,
              sowing_date::text, created_at::text, updated_at::text
       FROM fields WHERE id = $1`,
      [id]
    );
  }

  async findFieldsByFarmer(farmerId: string): Promise<Field[]> {
    return query<Field>(
      `SELECT id, farmer_id, name, crop_type, crop_variety,
              sowing_date::text, created_at::text, updated_at::text
       FROM fields WHERE farmer_id = $1
       ORDER BY created_at ASC`,
      [farmerId]
    );
  }

  async upsertField(field: Omit<Field, 'created_at' | 'updated_at'>): Promise<Field> {
    const row = await queryOne<Field>(
      `INSERT INTO fields (id, farmer_id, name, crop_type, crop_variety, sowing_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             crop_type = EXCLUDED.crop_type,
             crop_variety = EXCLUDED.crop_variety,
             sowing_date = EXCLUDED.sowing_date,
             updated_at = NOW()
       RETURNING id, farmer_id, name, crop_type, crop_variety,
                 sowing_date::text, created_at::text, updated_at::text`,
      [field.id, field.farmer_id, field.name, field.crop_type, field.crop_variety, field.sowing_date]
    );
    return row!;
  }

  async createField(
    farmerId: string,
    name: string,
    cropType: string,
    sowingDate: string,
    cropVariety?: string
  ): Promise<Field> {
    const row = await queryOne<Field>(
      `INSERT INTO fields (farmer_id, name, crop_type, crop_variety, sowing_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, farmer_id, name, crop_type, crop_variety,
                 sowing_date::text, created_at::text, updated_at::text`,
      [farmerId, name, cropType, cropVariety ?? null, sowingDate]
    );
    return row!;
  }
}

export class CropStateRepository {
  async getCropState(fieldId: string): Promise<any | null> {
    return queryOne(
      `SELECT field_id, confirmed_crop, confirmed_variety, current_stage,
              stage_description, stage_confidence, stage_conflict,
              accumulated_gdd::float, last_updated_from, updated_at::text
       FROM field_crop_states WHERE field_id = $1`,
      [fieldId]
    );
  }

  async upsertCropState(state: any): Promise<void> {
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
        state.field_id, state.confirmed_crop, state.confirmed_variety,
        state.current_stage, state.stage_description, state.stage_confidence,
        state.stage_conflict, state.accumulated_gdd, state.last_updated_from
      ]
    );
  }

  async getCropCalendar(cropType: string, region: string): Promise<any | null> {
    return queryOne(
      `SELECT id, crop_type, region, stages
       FROM crop_calendars
       WHERE crop_type = $1 AND region = $2`,
      [cropType, region]
    );
  }

  async getAllCropCalendars(): Promise<any[]> {
    return query('SELECT id, crop_type, region, stages FROM crop_calendars');
  }
}

export const farmerRepo = new FarmerRepository();
export const fieldRepo = new FieldRepository();
export const cropStateRepo = new CropStateRepository();
