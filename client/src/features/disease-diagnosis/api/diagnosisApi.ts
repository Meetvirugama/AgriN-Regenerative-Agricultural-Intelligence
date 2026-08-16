import { request } from '../../../services/apiClient';

export interface DiagnosisEvent {
  id: string;
  field_id: string;
  photo_url: string;
  submitted_at: string;
  crop_type: string;
  growth_stage: string;
  predicted_category: 'disease' | 'pest' | 'nutrient_deficiency' | 'water_stress' | 'heat_stress' | 'unknown';
  predicted_label: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high';
  recommended_action_text: string | null;
  escalation_triggered: boolean;
}

export const diagnosisApi = {
  async diagnoseCrop(fieldId: string, base64Image: string): Promise<DiagnosisEvent> {
    return request(`fields/${fieldId}/diagnose`, {
      method: 'POST',
      body: JSON.stringify({ image: base64Image })
    });
  },


  async getDiagnosisHistory(fieldId: string): Promise<DiagnosisEvent[]> {
    const data = await request<{ history: DiagnosisEvent[] }>(`fields/${fieldId}/diagnoses`);
    return data.history;
  }
};
