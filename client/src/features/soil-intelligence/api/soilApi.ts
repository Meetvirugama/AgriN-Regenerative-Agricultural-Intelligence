const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
    const response = await fetch(`${API_URL}/fields/${fieldId}/soil`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('NO_DATA');
      }
      throw new Error('Failed to fetch soil data');
    }
    return response.json();
  },

  parseLabReport: async (fieldId: string, file: Blob): Promise<ParsedSoilData> => {
    const formData = new FormData();
    formData.append('document', file, 'lab_report.jpg');

    const response = await fetch(`${API_URL}/fields/${fieldId}/soil/parse`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to parse document');
    }
    return response.json();
  },

  saveSoilProfile: async (fieldId: string, data: Partial<SoilProfile>): Promise<SoilProfile> => {
    const response = await fetch(`${API_URL}/fields/${fieldId}/soil/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save soil profile');
    }
    return response.json();
  }
};
