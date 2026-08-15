export interface Farmer {
  id: string;
  phone_number: string;
  name: string;
  preferred_language: string;
  created_at: string;
}

export interface Field {
  id: string;
  farmer_id: string;
  name: string;
  crop_type: string;
  crop_variety: string | null;
  sowing_date: string;
  created_at: string;
  updated_at: string;
}

export type StageEnum = 'germination' | 'vegetative' | 'flowering' | 'maturity';

export interface CropCalendar {
  id: string;
  crop_type: string;
  region: string;
  stages: {
    stage: StageEnum;
    gdd_threshold: number; // accumulated growing degree days required to REACH this stage
    typical_days: [number, number]; // [min, max] days
  }[];
}

export interface FieldCropState {
  field_id: string;
  confirmed_crop: string;
  confirmed_variety: string | null;
  current_stage: StageEnum;
  stage_description: string;
  stage_confidence: 'high' | 'moderate' | 'low' | 'unknown';
  stage_conflict: boolean;
  accumulated_gdd: number;
  last_updated_from: 'calendar_estimate' | 'satellite_phenology' | 'farmer_override';
  updated_at: string;
}

export interface OverrideEvent {
  id: string;
  field_id: string;
  previous_crop: string | null;
  new_crop: string;
  previous_stage: StageEnum | null;
  new_stage: StageEnum;
  timestamp: string;
}

// In-Memory Store
export class InMemoryDB {
  public farmers: Map<string, Farmer> = new Map();
  public fields: Map<string, Field> = new Map();
  public cropCalendars: Map<string, CropCalendar> = new Map();
  public fieldCropStates: Map<string, FieldCropState> = new Map();
  public overrideEvents: OverrideEvent[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed Crop Calendar Data
    this.cropCalendars.set('wheat_punjab', {
      id: 'wheat_punjab',
      crop_type: 'wheat',
      region: 'punjab',
      stages: [
        { stage: 'germination', gdd_threshold: 0, typical_days: [0, 7] },
        { stage: 'vegetative', gdd_threshold: 150, typical_days: [8, 60] },
        { stage: 'flowering', gdd_threshold: 600, typical_days: [61, 90] },
        { stage: 'maturity', gdd_threshold: 1200, typical_days: [91, 140] }
      ]
    });
    
    this.cropCalendars.set('rice_punjab', {
      id: 'rice_punjab',
      crop_type: 'rice',
      region: 'punjab',
      stages: [
        { stage: 'germination', gdd_threshold: 0, typical_days: [0, 10] },
        { stage: 'vegetative', gdd_threshold: 200, typical_days: [11, 70] },
        { stage: 'flowering', gdd_threshold: 800, typical_days: [71, 100] },
        { stage: 'maturity', gdd_threshold: 1500, typical_days: [101, 150] }
      ]
    });

    this.cropCalendars.set('maize_punjab', {
      id: 'maize_punjab',
      crop_type: 'maize',
      region: 'punjab',
      stages: [
        { stage: 'germination', gdd_threshold: 0, typical_days: [0, 8] },
        { stage: 'vegetative', gdd_threshold: 180, typical_days: [9, 50] },
        { stage: 'flowering', gdd_threshold: 700, typical_days: [51, 80] },
        { stage: 'maturity', gdd_threshold: 1300, typical_days: [81, 120] }
      ]
    });
  }
}

export const db = new InMemoryDB();
