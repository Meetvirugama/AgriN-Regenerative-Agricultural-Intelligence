import { Farmer, Field } from '../../models/Database';
import { farmerRepo, fieldRepo } from '../../db/repositories/farmerRepository';

/** Stable IDs for the development stub farmer and field. */
export const STUB_FARMER_ID = 'farmer_mock_1';
export const STUB_FIELD_ID  = 'field_stub_1';

export class Layer1Service {
  /**
   * Idempotent — returns the existing mock farmer or creates one.
   * Uses upsert so this is safe to call on every app boot.
   */
  public async getOrCreateMockFarmer(): Promise<Farmer> {
    return farmerRepo.upsertFarmer({
      id: STUB_FARMER_ID,
      phone_number: '+1234567890',
      name: 'Meena',
      preferred_language: 'en',
    });
  }

  /**
   * Idempotent stub field — always returns the same field_stub_1.
   * If the field doesn't exist yet, creates it sown 45 days ago.
   */
  public async getOrCreateStubField(farmerId: string): Promise<Field> {
    const existing = await fieldRepo.findFieldById(STUB_FIELD_ID);
    if (existing) return existing;

    const date45DaysAgo = new Date();
    date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);

    return fieldRepo.upsertField({
      id: STUB_FIELD_ID,
      farmer_id: farmerId,
      name: 'Main Plot',
      crop_type: 'wheat',
      crop_variety: null,
      sowing_date: date45DaysAgo.toISOString().split('T')[0],
    });
  }

  /**
   * Register a new field (real registration — Phase 4 will add auth guard).
   */
  public async registerField(
    farmerId: string,
    name: string,
    cropType: string,
    sowingDate: string,
    cropVariety?: string
  ): Promise<Field> {
    return fieldRepo.createField(farmerId, name, cropType, sowingDate, cropVariety);
  }

  public async getField(fieldId: string): Promise<Field | undefined> {
    return (await fieldRepo.findFieldById(fieldId)) ?? undefined;
  }
}

export const layer1Service = new Layer1Service();
