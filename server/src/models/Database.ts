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

export type EventType = 'rain_expected' | 'heat_event' | 'dry_spell' | 'humidity_spike' | 'frost_warning';

export interface FieldWeatherSnapshot {
  field_id: string;
  date: string; // YYYY-MM-DD
  source: string;
  rainfall_mm: number;
  temp_min: number;
  temp_max: number;
  humidity_pct: number;
  forecast_confidence: 'high' | 'medium' | 'low';
  is_forecast: boolean;
  ingested_at: string;
}

export interface WeatherEventFlag {
  id: string;
  field_id: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  generated_at: string;
}

export interface SoilProfile {
  id: string;
  field_id: string;
  source: 'lab_report' | 'regional_inference';
  texture: 'sandy' | 'loam' | 'clay' | 'sandy_loam' | 'clay_loam' | 'silt_loam';
  organic_matter_pct: number;
  nitrogen_level: 'low' | 'medium' | 'high';
  phosphorus_level: 'low' | 'medium' | 'high';
  potassium_level: 'low' | 'medium' | 'high';
  water_holding_capacity: 'low' | 'medium' | 'high';
  ph: number;
  report_date: string;
  raw_document_url: string | null;
  summary_text: string | null;
}

export interface RegionalSoilBaseline {
  region_id: string; // e.g. "US-MW"
  texture: 'sandy' | 'loam' | 'clay' | 'sandy_loam' | 'clay_loam' | 'silt_loam';
  avg_organic_matter: number;
  avg_npk: { n: 'low' | 'medium' | 'high', p: 'low' | 'medium' | 'high', k: 'low' | 'medium' | 'high' };
  avg_ph: number;
  water_holding_capacity: 'low' | 'medium' | 'high';
}

// In-Memory Store
export class InMemoryDB {
  public farmers: Map<string, Farmer> = new Map();
  public fields: Map<string, Field> = new Map();
  public cropCalendars: Map<string, CropCalendar> = new Map();
  public fieldCropStates: Map<string, FieldCropState> = new Map();
  public overrideEvents: OverrideEvent[] = [];
  public weatherSnapshots: Map<string, FieldWeatherSnapshot[]> = new Map();
  public weatherFlags: Map<string, WeatherEventFlag[]> = new Map();
  public soilProfiles: Map<string, SoilProfile[]> = new Map(); // history of profiles
  public regionalSoilBaselines: Map<string, RegionalSoilBaseline> = new Map();

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
    
    // Seed Regional Baseline for this region
    this.regionalSoilBaselines.set("US-MW", {
      region_id: "US-MW",
      texture: "silt_loam",
      avg_organic_matter: 3.5,
      avg_npk: { n: "medium", p: "medium", k: "high" },
      avg_ph: 6.8,
      water_holding_capacity: "high"
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
