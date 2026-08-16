import { request } from "../../../services/apiClient";

export const memoryApi = {
  getPendingPrompts: async (fieldId) => {
    try {
      const data = await request(`feedback/pending/${fieldId}`);
      return data.prompts || [];
    } catch (e) {
      console.error("Failed to fetch pending prompts", e);
      return [];
    }
  },

  submitFeedback: async (advisoryId, fieldId, responseType, note) => {
    try {
      await request("feedback", {
        method: "POST",
        body: JSON.stringify({
          advisory_id: advisoryId,
          field_id: fieldId,
          farmer_response: responseType,
          follow_up_note: note,
        }),
      });
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
  },

  getTimeline: async (fieldId) => {
    try {
      const data = await request(`timeline/${fieldId}`);
      return data.timeline || [];
    } catch (e) {
      console.error("Failed to fetch timeline", e);
      return [];
    }
  },
};
