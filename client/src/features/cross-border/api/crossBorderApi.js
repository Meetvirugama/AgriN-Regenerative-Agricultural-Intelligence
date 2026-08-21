import { request } from "../../../services/apiClient";

export const crossBorderApi = {
  /**
   * Fetch global cross-border insights for a given field.
   *
   * The backend returns: { fieldId, insights: [...] }
   * We return the insights array directly so consumers don't need to unwrap.
   */
  getInsights: async (fieldId) => {
    if (!fieldId) throw new Error("fieldId is required");
    const data = await request(`fields/${encodeURIComponent(fieldId)}/global-insights`);
    // `data.insights` is the array; fall back to [] if the key is missing.
    return Array.isArray(data?.insights) ? data.insights : [];
  },
};
