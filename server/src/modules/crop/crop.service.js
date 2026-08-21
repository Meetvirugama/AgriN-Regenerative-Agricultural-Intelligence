import { layer1Service } from "../field/field.service.js";
import { cropStateRepo } from "../../db/repositories/farmerRepository.js";
import { PythonClient } from "../../services/pythonClient.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { timelineRepo } from "../../db/repositories/feedbackRepository.js";

export class Layer2Service {
  getStageDescription(stage, cropType) {
    const descriptions = {
      wheat: {
        germination: "Ensure soil remains moist but not waterlogged.",
        vegetative: "Focus on nitrogen application and weed control.",
        flowering:
          "Critical period for water stress. Avoid chemical spraying if possible.",
        maturity: "Monitor for harvest readiness and dry conditions.",
      },
      rice: {
        germination: "Keep fields flooded but allow tips to breathe.",
        vegetative: "Top dress nitrogen and monitor for stem borers.",
        flowering: "Maintain water level. High disease vulnerability period.",
        maturity: "Drain field gradually to prepare for harvest.",
      },
      maize: {
        germination: "Protect from early pests and birds.",
        vegetative: "Critical period for nitrogen uptake.",
        flowering: "Silking stage. Highly sensitive to heat and drought.",
        maturity: "Black layer forming. Monitor grain moisture.",
      },
    };
    return descriptions[cropType]?.[stage] ?? "Monitor field regularly.";
  }

  async getFieldCropState(fieldId) {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field not found: ${fieldId}`);

    const existingState = await cropStateRepo.getCropState(fieldId);
    if (
      existingState &&
      existingState.last_updated_from === "farmer_override"
    ) {
      return existingState;
    }

    // Infer region from field coordinates instead of hardcoding 'punjab'
    const region = this._inferRegion(field.lat, field.lng);

    const calendar = await cropStateRepo.getCropCalendar(
      field.crop_type,
      region,
    );
    if (!calendar) {
      // Try fallback to 'punjab' default region if inferred region has no calendar
      const fallbackCalendar = await cropStateRepo.getCropCalendar(field.crop_type, 'punjab');
      if (!fallbackCalendar) {
        throw new Error(
          `Crop calendar not found for ${field.crop_type} in region ${region} (or fallback punjab)`,
        );
      }
      console.warn(`[Crop] No calendar for ${field.crop_type}/${region}, using punjab fallback.`);
      return this._computeStateFromCalendar(field, fallbackCalendar, fieldId, existingState);
    }

    return this._computeStateFromCalendar(field, calendar, fieldId, existingState);
  }

  /**
   * Infer an agricultural region name from lat/lng bounding boxes.
   * Mirrors the logic in soil.service.js._inferRegion() for consistency.
   */
  _inferRegion(lat, lng) {
    if (lat == null || lng == null) return 'punjab'; // default fallback

    // Punjab / Haryana (North India)
    if (lat >= 28.0 && lat <= 32.5 && lng >= 73.0 && lng <= 77.5) return 'punjab';
    // Rajasthan
    if (lat >= 23.0 && lat <= 30.5 && lng >= 69.0 && lng <= 78.5) return 'rajasthan';
    // Maharashtra
    if (lat >= 15.5 && lat <= 22.5 && lng >= 72.5 && lng <= 80.9) return 'maharashtra';
    // Karnataka
    if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.5) return 'karnataka';
    // Gujarat
    if (lat >= 20.0 && lat <= 24.5 && lng >= 68.0 && lng <= 74.5) return 'gujarat';
    // Uttar Pradesh / Bihar
    if (lat >= 24.0 && lat <= 28.5 && lng >= 77.0 && lng <= 88.5) return 'uttar_pradesh';

    return 'punjab'; // national default
  }

  /**
   * Shared state-computation logic after a calendar has been resolved.
   */
  async _computeStateFromCalendar(field, calendar, fieldId, existingState) {
    // Fetch real daily temperature history from weather_snapshots to enable proper GDD
    let temperatureHistory = null;
    try {
      const snapshots = await weatherRepo.getRecentSnapshots(fieldId, 90);
      if (snapshots.length > 0) {
        temperatureHistory = {
          temp_max_c: snapshots.map((s) => s.temp_max ?? s.temperature_max ?? 0),
          temp_min_c: snapshots.map((s) => s.temp_min ?? s.temperature_min ?? 0),
        };
      }
    } catch {
      // weather data unavailable — phenology falls back to 15 GDD/day estimate
    }

    // Call Python FastAPI for GDD calculation with real temperature data
    const phenology = await PythonClient.calculatePhenology(
      field.sowing_date,
      calendar,
      temperatureHistory,
    );

    const newState = {
      field_id: fieldId,
      confirmed_crop: field.crop_type,
      confirmed_variety: field.crop_variety,
      current_stage: phenology.current_stage,
      stage_description: phenology.stage_description,
      stage_confidence: phenology.gdd_method === "real_temperature" ? "high" : "moderate",
      stage_conflict: existingState?.stage_conflict ?? false,
      accumulated_gdd: phenology.accumulated_gdd,
      last_updated_from: "calendar_estimate",
      updated_at: new Date().toISOString(),
    };

    await cropStateRepo.upsertCropState(newState);
    return newState;
  }

  async overrideCropState(fieldId, cropType, variety, stage) {
    const existingState = await this.getFieldCropState(fieldId);

    const updatedState = {
      ...existingState,
      confirmed_crop: cropType || existingState.confirmed_crop,
      confirmed_variety: variety || existingState.confirmed_variety,
      current_stage: stage || existingState.current_stage,
      stage_description: this.getStageDescription(
        stage || existingState.current_stage,
        cropType || existingState.confirmed_crop,
      ),
      last_updated_from: "farmer_override",
      stage_conflict: false,
      updated_at: new Date().toISOString(),
    };

    await cropStateRepo.upsertCropState(updatedState);

    // Log to field history timeline
    try {
      await timelineRepo.addEntry({
        field_id: fieldId,
        entry_type: "farmer_note",
        summary_text: `Farmer updated crop stage to: ${stage || existingState.current_stage}`,
        linked_record_id: null,
        season_label: "This Season",
      });
    } catch (err) {
      console.error("[Crop] Failed to write timeline entry:", err);
    }

    return updatedState;
  }
}

export const layer2Service = new Layer2Service();
