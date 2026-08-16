import { layer1Service } from "../field/field.service.js";
import { cropStateRepo } from "../../db/repositories/farmerRepository.js";
import { PythonClient } from "../../services/pythonClient.js";

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

    const calendar = await cropStateRepo.getCropCalendar(
      field.crop_type,
      "punjab",
    );
    if (!calendar) {
      throw new Error(
        `Crop calendar not found for ${field.crop_type} in region punjab`,
      );
    }

    // Call Python FastAPI for scientific calculation
    const phenology = await PythonClient.calculatePhenology(
      field.sowing_date,
      calendar,
    );

    const newState = {
      field_id: fieldId,
      confirmed_crop: field.crop_type,
      confirmed_variety: field.crop_variety,
      current_stage: phenology.current_stage,
      stage_description: phenology.stage_description,
      stage_confidence: "high",
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
    return updatedState;
  }
}

export const layer2Service = new Layer2Service();
