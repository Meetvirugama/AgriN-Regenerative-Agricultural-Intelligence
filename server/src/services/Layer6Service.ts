export interface FieldHealthScore {
  field_id: string;
  computed_at: string;
  crop_health: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  water_condition: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  soil_condition: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  weather_risk: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  disease_risk: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  climate_stress: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  vegetation_trend: { value: string; severity: 'green' | 'amber' | 'red'; basis: string[] };
  synthesis_text: string | null;
}

export class Layer6Service {
  /**
   * Stubs the Layer 06 context for use by Layer 07.
   * This provides the structured explanation of field conditions.
   */
  public async getMockedFieldHealth(fieldId: string): Promise<FieldHealthScore> {
    return {
      field_id: fieldId,
      computed_at: new Date().toISOString(),
      crop_health: { value: 'moderate', severity: 'amber', basis: ['Recent heat wave stress', 'Vegetation slightly below average'] },
      water_condition: { value: 'dry', severity: 'amber', basis: ['No rain in 7 days', 'Soil moisture low'] },
      soil_condition: { value: 'good', severity: 'green', basis: ['NPK levels optimal', 'pH balanced'] },
      weather_risk: { value: 'moderate', severity: 'amber', basis: ['Heat warning active'] },
      disease_risk: { value: 'low', severity: 'green', basis: ['Low humidity reduces fungal risk'] },
      climate_stress: { value: 'high', severity: 'red', basis: ['Persistent high temperatures'] },
      vegetation_trend: { value: 'declining', severity: 'amber', basis: ['NDVI dipped by 15% last week'] },
      synthesis_text: 'Field is experiencing moderate heat stress and declining vegetation, but soil health remains stable.'
    };
  }
}

export const layer6Service = new Layer6Service();
