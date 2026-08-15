import { db, Farmer, Field } from '../../models/Database';

export class Layer1Service {
  /**
   * Stub to ensure a farmer exists for testing Layer 2.
   */
  public getOrCreateMockFarmer(): Farmer {
    const farmerId = 'farmer_mock_1';
    if (!db.farmers.has(farmerId)) {
      const farmer: Farmer = {
        id: farmerId,
        phone_number: '+1234567890',
        name: 'Meena',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
      };
      db.farmers.set(farmerId, farmer);
    }
    return db.farmers.get(farmerId)!;
  }

  /**
   * Stub to register a field (so Layer 2 has something to work with)
   */
  public registerField(
    farmerId: string,
    name: string,
    cropType: string,
    sowingDate: string
  ): Field {
    const fieldId = `field_${Date.now()}`;
    const field: Field = {
      id: fieldId,
      farmer_id: farmerId,
      name,
      crop_type: cropType,
      crop_variety: null,
      sowing_date: sowingDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.fields.set(fieldId, field);
    return field;
  }
  
  public getField(fieldId: string): Field | undefined {
    return db.fields.get(fieldId);
  }
}

export const layer1Service = new Layer1Service();
