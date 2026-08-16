import { request } from '../../../services/apiClient';

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
  initStub: async () => request<{ field: { id: string } }>('fields/stub-init', { method: 'POST' }),
  fetchCropState: async (fieldId: string): Promise<FieldCropState> => request(`fields/${fieldId}/crop-state`),
  identifyCrop: async (fieldId: string, _imageBlob: Blob) => {
    return request(`fields/${fieldId}/identify-crop`, {
      method: 'POST',
      body: JSON.stringify({ image: 'mock_base64' }),
    });
  },
  overrideCropState: async (
    fieldId: string,
    data: { cropType?: string; variety?: string; stage?: StageEnum }
  ): Promise<FieldCropState> => {
    return request(`fields/${fieldId}/override-stage`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
