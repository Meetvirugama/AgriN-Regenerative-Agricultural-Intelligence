import { db, DiagnosisEvent } from '../../models/Database';

export class Layer7Service {
  public async getDiagnosisHistory(fieldId: string): Promise<DiagnosisEvent[]> {
    return db.diagnosisEvents.get(fieldId) || [];
  }
}

export const layer7Service = new Layer7Service();
