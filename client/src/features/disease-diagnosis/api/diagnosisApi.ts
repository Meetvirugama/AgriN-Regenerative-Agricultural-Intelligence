import { API_BASE as API_URL } from '../../../lib/apiClient';

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
  async diagnoseCrop(fieldId: string, imageBlobSize: number): Promise<DiagnosisEvent> {
    const res = await fetch(`${API_URL}/fields/${fieldId}/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageBlobSize })
    });
    if (!res.ok) throw new Error('Diagnosis request failed');
    return res.json();
  },

  async getDiagnosisHistory(fieldId: string): Promise<DiagnosisEvent[]> {
    const res = await fetch(`${API_URL}/fields/${fieldId}/diagnoses`);
    if (!res.ok) throw new Error('Failed to fetch diagnosis history');
    const data = await res.json();
    return data.history;
  }
};
