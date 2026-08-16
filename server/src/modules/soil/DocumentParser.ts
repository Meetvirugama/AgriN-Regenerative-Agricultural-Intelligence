import { SoilProfile } from '../../models/Database';
import { PythonClient } from '../../services/pythonClient';

export interface ParsedSoilData extends Partial<SoilProfile> {
  overall_confidence: number; // 0-100
  field_confidences: Record<string, number>; // per-field confidence 0-100
}

/**
 * Delegates the multimodal vision AI call to the Python service.
 */
export class DocumentParser {
  public static async parseSoilReport(fileBuffer: Buffer): Promise<ParsedSoilData> {
    console.log('[DocumentParser] Delegating OCR/Vision to Python service...');
    // Assuming image/jpeg for the mock, but in production this would be passed down
    const result = await PythonClient.parseSoilReport(fileBuffer, 'image/jpeg');
    return result as ParsedSoilData;
  }
}
