import { request } from "../../../services/apiClient";

export const advisoryApi = {
  getAdvisory: async (fieldId) => {
    return request(`fields/${fieldId}/advisory`);
  },

  submitFeedback: async (fieldId, advisoryId, payload) => {
    return request(`fields/${fieldId}/advisory/response`, {
      method: "POST",
      body: JSON.stringify({ advisoryId, ...payload }),
    });
  },
};
