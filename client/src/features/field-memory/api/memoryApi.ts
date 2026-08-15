import { FieldTimelineEntry, PendingPrompt } from '../types';
import { API_BASE } from '../../../lib/apiClient';

export const memoryApi = {
  getPendingPrompts: async (fieldId: string): Promise<PendingPrompt[]> => {
    try {
      const response = await fetch(`${API_BASE}/feedback/pending/${fieldId}`);
      const data = await response.json();
      return data.prompts || [];
    } catch (e) {
      console.error('Failed to fetch pending prompts', e);
      return [];
    }
  },

  submitFeedback: async (advisoryId: string, fieldId: string, responseType: 'helped' | 'didnt_help', note?: string) => {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisory_id: advisoryId,
          field_id: fieldId,
          farmer_response: responseType,
          follow_up_note: note
        })
      });
    } catch (e) {
      console.error('Failed to submit feedback', e);
    }
  },

  getTimeline: async (fieldId: string): Promise<FieldTimelineEntry[]> => {
    try {
      const response = await fetch(`${API_BASE}/timeline/${fieldId}`);
      const data = await response.json();
      return data.timeline || [];
    } catch (e) {
      console.error('Failed to fetch timeline', e);
      return [];
    }
  }
};
