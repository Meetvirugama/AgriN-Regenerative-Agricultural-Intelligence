import { request } from "../../../services/apiClient";

export const cropApi = {
  initStub: async () => request("fields/stub-init", { method: "POST" }),
  fetchCropState: async (fieldId) => request(`fields/${fieldId}/crop-state`),
  identifyCrop: async (fieldId, _imageBlob) => {
    return request(`fields/${fieldId}/identify-crop`, {
      method: "POST",
      body: JSON.stringify({ image: "mock_base64" }),
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
  getDiagnosis: async (fieldId, imageBlob) => {
    // We mock this slightly since we're using identify-crop right now
    // In reality this would hit a proper diagnosis endpoint
    return request(`fields/${fieldId}/identify-crop`, {
      method: "POST",
      body: JSON.stringify({ image: "mock_base64" }),
    });
  },
  getAlerts: async () => request("alerts"),
  getExperts: async () => request("experts"),
  getIntelligence: async () => request("intelligence"),
  getRecentChats: async () => request("chat/recent"),
  sendChatMessage: async (message) => {
    return request("chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }
};
