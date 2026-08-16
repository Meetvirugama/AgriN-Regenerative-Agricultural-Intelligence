import { request } from "../../../services/apiClient";

export const weatherApi = {
  getForecast: async (fieldId) => {
    return request(`fields/${fieldId}/weather/forecast`);
  },
};
