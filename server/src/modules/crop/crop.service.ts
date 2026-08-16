import { FieldCropState, StageEnum, CropCalendar } from '../../models/Database';
import { layer1Service } from '../field/field.service';
import { cropStateRepo } from '../../db/repositories/farmerRepository';
import { PythonClient } from '../../services/pythonClient';

export class Layer2Service {
  private getStageDescription(stage: StageEnum, cropType: string): string {
    const descriptions: Record<string, Record<StageEnum, string>> = {
      wheat: {
        germination: 'Ensure soil remains moist but not waterlogged.',
        vegetative: 'Focus on nitrogen application and weed control.',
        flowering: 'Critical period for water stress. Avoid chemical spraying if possible.',
        maturity: 'Monitor for harvest readiness and dry conditions.',
      },
      rice: {
        germination: 'Keep fields flooded but allow tips to breathe.',
        vegetative: 'Top dress nitrogen and monitor for stem borers.',
        flowering: 'Maintain water level. High disease vulnerability period.',
        maturity: 'Drain field gradually to prepare for harvest.',
      },
      maize: {
        germination: 'Protect from early pests and birds.',
        vegetative: 'Critical period for nitrogen uptake.',
        flowering: 'Silking stage. Highly sensitive to heat and drought.',
        maturity: 'Black layer forming. Monitor grain moisture.',
      },
    };
    return descriptions[cropType]?.[stage] ?? 'Monitor field regularly.';
  }

  public async getFieldCropState(fieldId: string): Promise<FieldCropState> {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field not found: ${fieldId}`);

    const existingState = await cropStateRepo.getCropState(fieldId);
    if (existingState && existingState.last_updated_from === 'farmer_override') {
      return existingState;
    }

    const calendar = await cropStateRepo.getCropCalendar(field.crop_type, 'punjab');
    if (!calendar) {
      throw new Error(`Crop calendar not found for ${field.crop_type} in region punjab`);
    }

    // Call Python FastAPI for scientific calculation
    const phenology = await PythonClient.calculatePhenology(field.sowing_date, calendar);

    const newState: FieldCropState = {
      field_id: fieldId,
      confirmed_crop: field.crop_type,
      confirmed_variety: field.crop_variety,
      current_stage: phenology.current_stage as StageEnum,
      stage_description: phenology.stage_description,
      stage_confidence: 'high',
      stage_conflict: existingState?.stage_conflict ?? false,
      accumulated_gdd: phenology.accumulated_gdd,
      last_updated_from: 'calendar_estimate',
      updated_at: new Date().toISOString(),
    };

    await cropStateRepo.upsertCropState(newState);
    return newState;
  }

  public async overrideCropState(
    fieldId: string,
    cropType?: string,
    variety?: string,
    stage?: StageEnum
  ): Promise<FieldCropState> {
    const existingState = await this.getFieldCropState(fieldId);

    const updatedState: FieldCropState = {
      ...existingState,
      confirmed_crop: cropType || existingState.confirmed_crop,
      confirmed_variety: variety || existingState.confirmed_variety,
      current_stage: stage || existingState.current_stage,
      stage_description: this.getStageDescription(
        stage || existingState.current_stage,
        cropType || existingState.confirmed_crop
      ),
      last_updated_from: 'farmer_override',
      stage_conflict: false,
      updated_at: new Date().toISOString(),
    };

    await cropStateRepo.upsertCropState(updatedState);
    return updatedState;
  }
}

export const layer2Service = new Layer2Service();

