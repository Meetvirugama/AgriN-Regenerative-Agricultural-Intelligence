export type Severity = 'green' | 'amber' | 'red';

export interface DimensionResult {
  value: string;
  severity: Severity;
  basis: string[];
}

export interface FieldHealthScore {
  fieldId: string;
  computedAt: string;
  crop_health: DimensionResult;
  water_condition: DimensionResult;
  soil_condition: DimensionResult;
  weather_risk: DimensionResult;
  disease_risk: DimensionResult;
  climate_stress: DimensionResult;
  vegetation_trend: DimensionResult;
  synthesis_text: string | null;
}
