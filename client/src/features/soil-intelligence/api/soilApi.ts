import { request, ApiError } from '../../../services/apiClient';

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

export interface ParsedSoilData extends Partial<SoilProfile> {
  overall_confidence: number;
  field_confidences: Record<string, number>;
}

export const soilApi = {
  getSoilProfile: async (fieldId: string): Promise<SoilProfile> => {
    try {
      return await request(`fields/${fieldId}/soil`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('NO_DATA');
      }
      throw error;
    }
  },

  parseLabReport: async (fieldId: string, file: Blob): Promise<ParsedSoilData> => {
    const formData = new FormData();
    formData.append('document', file, 'lab_report.jpg');
    return request(`fields/${fieldId}/soil/parse`, {
      method: 'POST',
      body: formData,
    });
  },

  saveSoilProfile: async (fieldId: string, data: Partial<SoilProfile>): Promise<SoilProfile> => {
    return request(`fields/${fieldId}/soil/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
