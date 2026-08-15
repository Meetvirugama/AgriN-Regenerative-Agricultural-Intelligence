import { API_BASE } from '../../../lib/apiClient';

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
    const res = await fetch(`${API_BASE}/fields/${fieldId}/global-insights`);
    if (!res.ok) throw new Error('Failed to fetch global insights');
    const data = await res.json();
    return data.insights;
  }
};
