import { request } from "../../../services/apiClient";

export const regenApi = {
  async getRegenPlan(fieldId) {
    return request(`fields/${fieldId}/regen/planning`);
  },
};
