import { FieldTimelineEntry, PendingPrompt } from '../types';
import { request } from '../../../services/apiClient';

export const memoryApi = {
  getPendingPrompts: async (fieldId: string): Promise<PendingPrompt[]> => {
    try {
      const data = await request<{prompts: PendingPrompt[]}>(`feedback/pending/${fieldId}`);
      return data.prompts || [];
    } catch (e) {
      console.error('Failed to fetch pending prompts', e);
      return [];
    }
  },

  submitFeedback: async (advisoryId: string, fieldId: string, responseType: 'helped' | 'didnt_help', note?: string) => {
    try {
      await request('feedback', {
        method: 'POST',
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
      const data = await request<{timeline: FieldTimelineEntry[]}>(`timeline/${fieldId}`);
      return data.timeline || [];
    } catch (e) {
      console.error('Failed to fetch timeline', e);
      return [];
    }
  }
};
