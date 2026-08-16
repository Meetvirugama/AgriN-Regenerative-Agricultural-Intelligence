import { request } from "../../../services/apiClient";

export const diagnosisApi = {
  async diagnoseCrop(fieldId, base64Image) {
    return request(`fields/${fieldId}/diagnose`, {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    });
  },

  async getDiagnosisHistory(fieldId) {
    const data = await request(`fields/${fieldId}/diagnoses`);
    return data.history;
  },
};
