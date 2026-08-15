import { API_BASE } from '../../../lib/apiClient';

export type StageEnum = 'germination' | 'vegetative' | 'flowering' | 'maturity';

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

export const cropApi = {
  // Stub init to get a field to work with
  initStub: async () => {
    const res = await fetch(`${API_BASE}/fields/stub-init`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to init stub');
    return res.json();
  },

  fetchCropState: async (fieldId: string): Promise<FieldCropState> => {
    const res = await fetch(`${API_BASE}/fields/${fieldId}/crop-state`);
    if (!res.ok) throw new Error('Failed to fetch crop state');
    return res.json();
  },

  identifyCrop: async (fieldId: string, imageBlob: Blob) => {
    const formData = new FormData();
    formData.append('image', imageBlob);
    
    // Using simple fetch without formData for mock simplicity
    const res = await fetch(`${API_BASE}/fields/${fieldId}/identify-crop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: 'mock_base64' }),
    });
    
    if (!res.ok) throw new Error('Failed to identify crop');
    return res.json();
  },

  overrideCropState: async (
    fieldId: string,
    data: { cropType?: string; variety?: string; stage?: StageEnum }
  ): Promise<FieldCropState> => {
    const res = await fetch(`${API_BASE}/fields/${fieldId}/override-stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) throw new Error('Failed to override crop state');
    return res.json();
  }
};
