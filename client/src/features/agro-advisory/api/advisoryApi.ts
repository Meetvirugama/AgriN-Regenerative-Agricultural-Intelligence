import { Advisory, FarmerFeedbackPayload } from '../types';
import { request } from '../../../services/apiClient';

export const advisoryApi = {
  getAdvisory: async (fieldId: string): Promise<Advisory> => {
    return request(`fields/${fieldId}/advisory`);
  },

  submitFeedback: async (fieldId: string, advisoryId: string, payload: FarmerFeedbackPayload): Promise<void> => {
    return request(`fields/${fieldId}/advisory/response`, {
      method: 'POST',
      body: JSON.stringify({ advisoryId, ...payload }),
    });
  }
};
