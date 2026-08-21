import { request } from "../../../services/apiClient";

export async function getSoilProfile(fieldId) {
  if (!fieldId) throw new Error("fieldId is required.");
  return request(`fields/${encodeURIComponent(fieldId)}/soil`);
}

export async function uploadSoilLabReport(fieldId, file) {
  if (!fieldId) throw new Error("fieldId is required.");
  if (!(file instanceof File)) throw new Error("A valid report file is required.");

  const formData = new FormData();
  formData.append("report", file);

  // Note: we can't use our standard JSON request wrapper for FormData
  // directly without some config, but apiClient's request supports it
  // via its default handling!
  return request(`fields/${encodeURIComponent(fieldId)}/soil/lab-report`, {
    method: "POST",
    body: formData,
  });
}
