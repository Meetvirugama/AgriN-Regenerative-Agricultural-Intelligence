import { request, ApiError } from "../../../services/apiClient";

export const soilApi = {
  getSoilProfile: async (fieldId) => {
    try {
      return await request(`fields/${fieldId}/soil`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("NO_DATA");
      }
      throw error;
    }
  },

  parseLabReport: async (fieldId, file) => {
    const formData = new FormData();
    formData.append("document", file, "lab_report.jpg");
    return request(`fields/${fieldId}/soil/parse`, {
      method: "POST",
      body: formData,
    });
  },

  saveSoilProfile: async (fieldId, data) => {
    return request(`fields/${fieldId}/soil/save`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
