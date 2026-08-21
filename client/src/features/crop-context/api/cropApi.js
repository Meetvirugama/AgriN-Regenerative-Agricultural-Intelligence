import { request } from "../../../services/apiClient";

export const cropApi = {
  fetchCropState: async (fieldId) => request(`fields/${fieldId}/crop-state`),
  identifyCrop: async (fieldId, imageBlob) => {
    // The backend reads req.body.image as a base64 data URL (JSON body).
    // Convert the Blob to base64 before sending.
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image blob"));
      reader.readAsDataURL(imageBlob);
    });
    return request(`fields/${fieldId}/identify-crop`, {
      method: "POST",
      body: JSON.stringify({ image: base64 }),
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
  getAlerts: async () => {
    const data = await request("alerts");
    return data?.alerts || data || [];
  },
  markAlertRead: async (alertId) => request(`alerts/${alertId}/read`, { method: "PATCH" }),
  markAllAlertsRead: async () => request("alerts/read-all", { method: "PATCH" }),
  getProfile: async () => request("profile"),
  updateProfile: async (payload) => request("profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }),
  getSettings: async () => request("settings"),
  updateSettings: async (payload) => request("settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }),
  getIntelligence: async () => request("intelligence"),
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

