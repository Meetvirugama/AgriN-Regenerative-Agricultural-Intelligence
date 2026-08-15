import { db, FieldCropState, StageEnum, CropCalendar } from '../../models/Database';
import { layer1Service } from '../field/field.service';

export class Layer2Service {
  /**
   * Stub function to calculate GDD since sowing date.
   * Assumes 15 GDD accumulated per day on average for this mock.
   */
  private calculateAccumulatedGDD(sowingDate: string): number {
    const sowing = new Date(sowingDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - sowing.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Stub: 15 GDD per day
    return diffDays * 15;
  }

  /**
   * Returns the correct stage based on accumulated GDD and the crop calendar.
   */
  private inferStageFromGDD(gdd: number, calendar: CropCalendar): StageEnum {
    // Sort stages by threshold ascending
    const sortedStages = [...calendar.stages].sort((a, b) => a.gdd_threshold - b.gdd_threshold);
    
    let currentStage = sortedStages[0].stage;
    for (const stage of sortedStages) {
      if (gdd >= stage.gdd_threshold) {
        currentStage = stage.stage;
      } else {
        break;
      }
    }
    
    return currentStage;
  }

  private getStageDescription(stage: StageEnum, cropType: string): string {
    const descriptions: Record<string, Record<StageEnum, string>> = {
      wheat: {
        germination: 'Ensure soil remains moist but not waterlogged.',
        vegetative: 'Focus on nitrogen application and weed control.',
        flowering: 'Critical period for water stress. Avoid chemical spraying if possible.',
        maturity: 'Monitor for harvest readiness and dry conditions.'
      },
      rice: {
        germination: 'Keep fields flooded but allow tips to breathe.',
        vegetative: 'Top dress nitrogen and monitor for stem borers.',
        flowering: 'Maintain water level. High disease vulnerability period.',
        maturity: 'Drain field gradually to prepare for harvest.'
      },
      maize: {
        germination: 'Protect from early pests and birds.',
        vegetative: 'Critical period for nitrogen uptake.',
        flowering: 'Silking stage. Highly sensitive to heat and drought.',
        maturity: 'Black layer forming. Monitor grain moisture.'
      }
    };
    return descriptions[cropType]?.[stage] || 'Monitor field regularly.';
  }

  public getFieldCropState(fieldId: string): FieldCropState {
    const field = layer1Service.getField(fieldId);
    if (!field) {
      throw new Error(`Field not found: ${fieldId}`);
    }

    const existingState = db.fieldCropStates.get(fieldId);
    
    if (existingState && existingState.last_updated_from === 'farmer_override') {
       return existingState;
    }

    const calendarKey = `${field.crop_type}_punjab`;
    const calendar = db.cropCalendars.get(calendarKey);

    if (!calendar) {
      throw new Error(`Crop calendar not found for ${field.crop_type} in region punjab`);
    }

    const gdd = this.calculateAccumulatedGDD(field.sowing_date);
    const inferredStage = this.inferStageFromGDD(gdd, calendar);

    const newState: FieldCropState = {
      field_id: fieldId,
      confirmed_crop: field.crop_type,
      confirmed_variety: field.crop_variety,
      current_stage: inferredStage,
      stage_description: this.getStageDescription(inferredStage, field.crop_type),
      stage_confidence: 'high',
      stage_conflict: existingState ? existingState.stage_conflict : false,
      accumulated_gdd: gdd,
      last_updated_from: 'calendar_estimate',
      updated_at: new Date().toISOString()
    };

    db.fieldCropStates.set(fieldId, newState);
    return newState;
  }

  public identifyCrop(fieldId: string, _imageBlob: any) {
    // Mocking Gemini Vision output
    return {
      crop: 'wheat',
      variety: 'HD2967',
      confidence: 'high', // Use high/moderate/low
    };
  }

  public overrideCropState(
    fieldId: string, 
    cropType?: string, 
    variety?: string, 
    stage?: StageEnum
  ): FieldCropState {
    const existingState = this.getFieldCropState(fieldId);
    
    const updatedState: FieldCropState = {
      ...existingState,
      confirmed_crop: cropType || existingState.confirmed_crop,
      confirmed_variety: variety || existingState.confirmed_variety,
      current_stage: stage || existingState.current_stage,
      stage_description: this.getStageDescription(stage || existingState.current_stage, cropType || existingState.confirmed_crop),
      last_updated_from: 'farmer_override',
      stage_conflict: false, // reset conflict on explicit override
      updated_at: new Date().toISOString()
    };

    db.fieldCropStates.set(fieldId, updatedState);
    
    // Log the override as a distinct event (for Layer 12)
    db.overrideEvents.push({
      id: `override_${Date.now()}`,
      field_id: fieldId,
      previous_crop: existingState.confirmed_crop,
      new_crop: updatedState.confirmed_crop,
      previous_stage: existingState.current_stage,
      new_stage: updatedState.current_stage,
      timestamp: new Date().toISOString()
    });
    
    // If crop changed, update Layer 1 field
    const field = layer1Service.getField(fieldId);
    if (field && cropType) {
      field.crop_type = cropType;
      field.updated_at = new Date().toISOString();
    }
    
    return updatedState;
  }
}

export const layer2Service = new Layer2Service();
