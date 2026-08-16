import { request } from '../../../services/apiClient';

export interface GlobalInsight {
  id: string;
  insightType: 'practice' | 'risk_model';
  sourceRegion: string;
  comparableClimateZone: string;
  recommendation: string;
  confidenceScore: number;
  adoptionRate: number;
}

export interface CrossBorderResponse {
  fieldId: string;
  insights: GlobalInsight[];
}

export const crossBorderApi = {
  getInsights: async (fieldId: string): Promise<GlobalInsight[]> => {
    const data = await request<CrossBorderResponse>(`fields/${fieldId}/global-insights`);
    return data.insights;
  }
};
