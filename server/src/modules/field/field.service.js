import { farmerRepo, fieldRepo } from "../../db/repositories/farmerRepository.js";

/** Stable IDs for the development stub farmer and field. */
export const STUB_FARMER_ID = "11111111-1111-1111-1111-111111111111";
export const STUB_FIELD_ID = "22222222-2222-2222-2222-222222222222";

export class Layer1Service {
  /**
   * Idempotent — returns the existing mock farmer or creates one.
   * Uses upsert so this is safe to call on every app boot.
   */
  async getOrCreateMockFarmer() {
    return farmerRepo.upsertFarmer({
      id: STUB_FARMER_ID,
      phone_number: "+1234567890",
      name: "Meena",
      preferred_language: "en",
    });
  }

  /**
   * Idempotent stub field — always returns the same field_stub_1.
   * If the field doesn't exist yet, creates it sown 45 days ago.
   */
  async getOrCreateStubField(farmerId) {
    const existing = await fieldRepo.findFieldById(STUB_FIELD_ID);
    if (existing) return existing;

    const date45DaysAgo = new Date();
    date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);

    return fieldRepo.upsertField({
      id: STUB_FIELD_ID,
      farmer_id: farmerId,
      name: "Main Plot",
      crop_type: "wheat",
      crop_variety: null,
      sowing_date: date45DaysAgo.toISOString().split("T")[0],
    });
  }

  /**
   * Register a new field (real registration — Phase 4 will add auth guard).
   */
  async registerField(farmerId, name, cropType, sowingDate, cropVariety, lat, lng, locationName, areaHectares, boundaryGeojson) {
    return fieldRepo.createField(
      farmerId,
      name,
      cropType,
      sowingDate,
      cropVariety,
      lat,
      lng,
      locationName,
      areaHectares,
      boundaryGeojson
    );
  }

  async getField(fieldId) {
    return (await fieldRepo.findFieldById(fieldId)) ?? undefined;
  }

  async getAllFieldsForFarmer(farmerId) {
    try {
      // Try to fetch from DB
      return await fieldRepo.findFieldsByFarmer(farmerId);
    } catch (e) {
      console.warn("DB connection failed, falling back to mock fields data.");
      // Fallback mock data if DB is not configured correctly
      const date1 = new Date(); date1.setDate(date1.getDate() - 46);
      const date2 = new Date(); date2.setDate(date2.getDate() - 31);
      const date3 = new Date(); date3.setDate(date3.getDate() - 60);
      
      return [
        {
          id: "field_mock_1",
          farmer_id: farmerId,
          name: "Wheat Field 01",
          crop_type: "wheat",
          crop_variety: "Variety X",
          sowing_date: date1.toISOString().split("T")[0],
          created_at: date1.toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "field_mock_2",
          farmer_id: farmerId,
          name: "Rice Field 02",
          crop_type: "rice",
          crop_variety: "Variety J",
          sowing_date: date2.toISOString().split("T")[0],
          created_at: date2.toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "field_mock_3",
          farmer_id: farmerId,
          name: "Moong Field 03",
          crop_type: "moong",
          crop_variety: "Local",
          sowing_date: date3.toISOString().split("T")[0],
          created_at: date3.toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
  }
}

export const layer1Service = new Layer1Service();
