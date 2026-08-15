import { Advisory, FarmerFeedbackPayload } from '../types';

// Mock API client for Agro-Advisory
export const advisoryApi = {
  getAdvisory: async (fieldId: string): Promise<Advisory> => {
    try {
      const response = await fetch(`http://localhost:8000/api/fields/${fieldId}/advisory`);
      if (!response.ok) {
        throw new Error('Failed to fetch advisory');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching advisory:', error);
      // Fallback mock data if server is unreachable
      return {
        id: `adv-${Date.now()}`,
        field_id: fieldId,
        generated_at: new Date().toISOString(),
        trigger: 'scheduled',
        what_text: 'Your wheat crop is showing early signs of heat stress.',
        why_text: 'Temperatures have been 3°C above average for the past week, and satellite imagery shows a slight dip in canopy moisture.',
        severity: 'Medium',
        action_text: 'Increase irrigation duration by 20% during your next watering cycle.',
        action_deadline: 'Within the next 48 hours',
        monitor_text: 'Watch for yellowing on the lower leaves, which could indicate the stress is continuing.',
        source_layers: ['Layer 02 (Stage)', 'Layer 03 (Weather)', 'Layer 05 (Satellite)'],
        farmer_response: null,
        overridden_reason: null
      };
    }
  },

  submitFeedback: async (fieldId: string, advisoryId: string, payload: FarmerFeedbackPayload): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8000/api/fields/${fieldId}/advisory/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advisoryId, ...payload }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }
};
