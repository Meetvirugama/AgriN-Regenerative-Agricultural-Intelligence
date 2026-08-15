import { FieldTimelineEntry, PendingPrompt } from '../types';

export const memoryApi = {
  getPendingPrompts: async (fieldId: string): Promise<PendingPrompt[]> => {
    try {
      const response = await fetch(`http://localhost:8000/api/feedback/pending/${fieldId}`);
      const data = await response.json();
      return data.prompts || [];
    } catch (e) {
      console.error('Failed to fetch pending prompts', e);
      return [];
    }
  },

  submitFeedback: async (advisoryId: string, fieldId: string, responseType: 'helped' | 'didnt_help', note?: string) => {
    try {
      await fetch('http://localhost:8000/api/feedback', {
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
      const response = await fetch(`http://localhost:8000/api/timeline/${fieldId}`);
      const data = await response.json();
      return data.timeline || [];
    } catch (e) {
      console.error('Failed to fetch timeline', e);
      return [];
    }
  }
};
