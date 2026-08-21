import { request } from "../../../services/apiClient";

export const cropApi = {
  fetchCropState: async (fieldId) => request(`fields/${fieldId}/crop-state`),
  identifyCrop: async (fieldId, imageBlob) => {
    const formData = new FormData();
    formData.append("image", imageBlob);
    return request(`fields/${fieldId}/identify-crop`, {
      method: "POST",
      body: formData,
    });
  },
  overrideCropState: async (fieldId, data) => {
    return request(`fields/${fieldId}/override-stage`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  createField: async (fieldData) => {
    return request("fields", {
      method: "POST",
      body: JSON.stringify(fieldData),
    });
  },
  getAllFields: async () => request("fields"),
  deleteField: async (fieldId) =>
    request(`fields/${fieldId}`, { method: "DELETE" }),
  updateField: async (fieldId, data) =>
    request(`fields/${fieldId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getAlerts: async () => request("alerts"),
  getIntelligence: async () => request("intelligence"),
  getRecentChats: async () => request("chat/recent"),
  getChatHistory: async () => request("chat/history"),
  sendChatMessage: async (message) => {
    return request("chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};

