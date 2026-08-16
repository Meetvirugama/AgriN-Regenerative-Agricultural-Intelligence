import { db } from "../../models/database.js";

export class Layer7Service {
  async getDiagnosisHistory(fieldId) {
    return db.diagnosisEvents.get(fieldId) || [];
  }
}

export const layer7Service = new Layer7Service();
