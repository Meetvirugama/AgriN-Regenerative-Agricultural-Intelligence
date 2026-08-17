import { soilRepo } from "../../db/repositories/soilRepository.js";
import { layer1Service } from "../field/field.service.js";
import { SoilGridsProvider } from "./soilgrids.provider.js";
import { DocumentParser } from "./document.parser.js";

/**
 * SoilService (Layer 04)
 *
 * Retrieval priority:
 *   1. Lab report in DB (most accurate, farmer-submitted)
 *   2. SoilGrids data fetched < 30 days ago (real satellite-derived soil data)
 *   3. Fetch fresh from SoilGrids API (if field has coordinates)
 *   4. Regional soil baseline (seeded from literature, lowest confidence)
 *
 * Every returned profile is badged with `source` so downstream consumers
 * (Gemini advisory) can communicate data quality honestly.
 */
class SoilService {
  constructor() {
    this.soilGrids = new SoilGridsProvider();
  }

  /**
   * Get the best available soil profile for a field.
   * Follows the four-tier priority chain described above.
   */
  async getActiveSoilProfile(fieldId) {
    // 1. Check DB for any existing profile (lab report wins)
    const existing = await soilRepo.findLatestProfile(fieldId);
    if (existing) {
      // If it's a fresh SoilGrids fetch (< 30 days), return it directly
      if (existing.source === "soilgrids") {
        const recentSG = await soilRepo.findRecentSoilGridsProfile(fieldId, 30);
        if (recentSG) return recentSG;
        // SoilGrids profile is stale — fall through to re-fetch
      } else {
        // Lab report or regional inference — return as-is
        return existing;
      }
    }

    // 2. Attempt to fetch fresh from SoilGrids using field coordinates
    const field = await layer1Service.getField(fieldId);
    if (field?.lat != null && field?.lng != null) {
      try {
        const soilData = await this.soilGrids.fetchSoilProfile(field.lat, field.lng);
        const profile = await soilRepo.saveProfile({
          field_id: fieldId,
          ...soilData,
          source: "soilgrids",
        });
        console.log(`[Soil] Fetched real SoilGrids data for field ${fieldId} (lat:${field.lat}, lng:${field.lng})`);
        return profile;
      } catch (err) {
        console.warn(`[Soil] SoilGrids unavailable for field ${fieldId}: ${err.message}. Falling back to regional baseline.`);
      }
    }

    // 3. Fall back to regional baseline based on field location
    const region = this._inferRegion(field?.lat, field?.lng);
    const baseline = await soilRepo.findRegionalBaseline(region);
    if (baseline) {
      console.log(`[Soil] Using regional baseline (${region}) for field ${fieldId}`);
      return {
        field_id: fieldId,
        source: "regional_inference",
        region,
        ...baseline,
        confidence: 0.45,
      };
    }

    return null;
  }

  /**
   * Parse and save a farmer-submitted lab report (image/PDF via Gemini Vision).
   */
  async parseAndSaveLabReport(fieldId, fileBuffer) {
    const parsed = await DocumentParser.parseSoilReport(fileBuffer);
    if (!parsed) throw new Error("Could not parse soil report document.");

    return soilRepo.saveProfile({
      field_id: fieldId,
      source: "lab_report",
      ...parsed,
    });
  }

  /**
   * Directly save a reviewed soil profile (e.g. from the UI confirmation step).
   */
  async saveReviewedProfile(fieldId, data) {
    return soilRepo.saveProfile({
      field_id: fieldId,
      source: data.source ?? "lab_report",
      ...data,
    });
  }

  /**
   * Infer a broad region from lat/lng for regional baseline lookup.
   * Covers major Indian agricultural states.
   */
  _inferRegion(lat, lng) {
    if (lat == null || lng == null) return "punjab"; // safest default
    // Punjab: lat 29–32, lng 73–76
    if (lat >= 29 && lat <= 32 && lng >= 73 && lng <= 76) return "punjab";
    // Maharashtra: lat 15–22, lng 72–81
    if (lat >= 15 && lat <= 22 && lng >= 72 && lng <= 81) return "maharashtra";
    // Karnataka: lat 11–18, lng 74–78
    if (lat >= 11 && lat <= 18 && lng >= 74 && lng <= 78) return "karnataka";
    // Gujarat: lat 20–24, lng 68–74
    if (lat >= 20 && lat <= 24 && lng >= 68 && lng <= 74) return "maharashtra"; // nearest match
    return "punjab";
  }
}

export const soilService = new SoilService();

// Legacy alias for modules that still import layer4Service
export const layer4Service = soilService;
