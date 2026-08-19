import { farmerRepo, fieldRepo } from "../../db/repositories/farmerRepository.js";

/** Stable ID for the development stub farmer. */
export const STUB_FARMER_ID = "11111111-1111-1111-1111-111111111111";

export class Layer1Service {
  /**
   * Idempotent — returns the existing stub farmer or creates one.
   * Used only in unauthenticated dev mode (STUB_FARMER_ID fallback).
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
   * Register a new field (real registration).
   */
  async registerField(farmerId, name, cropType, sowingDate, cropVariety, lat, lng, locationName, areaHectares, boundaryGeojson, irrigationType) {
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
      boundaryGeojson,
      irrigationType,
    );
  }

  async getField(fieldId) {
    return (await fieldRepo.findFieldById(fieldId)) ?? undefined;
  }

  async getAllFieldsForFarmer(farmerId) {
    return fieldRepo.findFieldsByFarmer(farmerId);
  }

  async updateField(fieldId, data) {
    return fieldRepo.updateField(fieldId, data);
  }

  async deleteField(fieldId) {
    return fieldRepo.deleteField(fieldId);
  }
}

export const layer1Service = new Layer1Service();

