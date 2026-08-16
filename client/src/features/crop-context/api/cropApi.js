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
};
