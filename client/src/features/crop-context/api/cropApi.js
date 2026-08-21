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
  getRecentChats: async () => request("chat/recent"),
  getChatHistory: async ({ limit = 50, cursor = null } = {}) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor) {
      params.set("cursor", cursor);
    }
    const response = await request(`ask/history?${params.toString()}`);
    return Array.isArray(response) ? response : (response?.messages || []);
  },
  sendChatMessage: async ({ message, clientMessageId, signal }) => {
    return request("ask/message", {
      method: "POST",
      signal,
      body: JSON.stringify({ message, clientMessageId }),
    });
  },
  getAskContext: async () => request("ask/context"),
  clearChatHistory: async () => request("ask/history", { method: "DELETE" }),
};

