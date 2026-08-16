import { request } from "../../../services/apiClient";

export const crossBorderApi = {
  getInsights: async (fieldId) => {
    const data = await request(`fields/${fieldId}/global-insights`);
    return data.insights;
  },
};
