import { request } from "../../../services/apiClient";

export const diagnosisApi = {
  /**
   * Submit a crop photo for diagnosis.
   * @param {string} fieldId
   * @param {string} base64Image - full data URL: "data:image/jpeg;base64,..."
   * @param {object} [opts] - { latitude, longitude }
   */
  async diagnoseCrop(fieldId, base64Image, opts = {}) {
    return request(`fields/${fieldId}/diagnose`, {
      method: "POST",
      body: JSON.stringify({
        image: base64Image,
        latitude: opts.latitude ?? null,
        longitude: opts.longitude ?? null,
      }),
    });
  },

  /** Get all past observations for a field (newest first). */
  async getObservations(fieldId, limit = 20) {
    const data = await request(`fields/${fieldId}/observations?limit=${limit}`);
    return data.observations ?? [];
  },

  /** Update outcome feedback for an observation */
  async submitObservationFeedback(fieldId, obsId, outcome, outcomeNotes = "") {
    return request(`fields/${fieldId}/observations/${obsId}`, {
      method: "PUT",
      body: JSON.stringify({ outcome, outcome_notes: outcomeNotes }),
    });
  },

  /** Legacy alias */
  async getDiagnosisHistory(fieldId) {
    const data = await request(`fields/${fieldId}/diagnoses`);
    return data.history ?? [];
  },
};
