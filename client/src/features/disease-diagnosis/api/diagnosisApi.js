import { request } from "../../../services/apiClient";

export const diagnosisApi = {
  /**
   * Submit a crop photo (+ optional extra photos + farmer Q&A) for diagnosis.
   * @param {string} fieldId
   * @param {string} base64Image - primary image: "data:image/jpeg;base64,..."
   * @param {object} [opts] - { latitude, longitude, image2, image3, farmerObservations }
   *   image2: data URL for whole-plant photo
   *   image3: data URL for close-up / leaf underside
   *   farmerObservations: { noticed_when, is_spreading, recent_rain, recent_spray, affected_area }
   */
  async diagnoseCrop(fieldId, base64Image, opts = {}) {
    return request(`fields/${fieldId}/diagnose`, {
      method: "POST",
      body: JSON.stringify({
        image: base64Image,
        image2: opts.image2 ?? null,
        image3: opts.image3 ?? null,
        latitude: opts.latitude ?? null,
        longitude: opts.longitude ?? null,
        farmerObservations: opts.farmerObservations ?? null,
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

  /** Get all farmer's fields for the field selector */
  async getFields() {
    return request("fields");
  },

  /** Legacy alias */
  async getDiagnosisHistory(fieldId) {
    const data = await request(`fields/${fieldId}/diagnoses`);
    return data.history ?? [];
  },
};
