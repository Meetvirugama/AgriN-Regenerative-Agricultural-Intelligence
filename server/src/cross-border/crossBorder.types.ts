export interface GlobalInsight {
  id: string;
  insightType: 'practice' | 'risk_model';
  sourceRegion: string;
  comparableClimateZone: string;
  recommendation: string;
  confidenceScore: number;
  adoptionRate: number; // Percentage of similar farms adopting this
}

export interface CrossBorderResponse {
  fieldId: string;
  insights: GlobalInsight[];
}
