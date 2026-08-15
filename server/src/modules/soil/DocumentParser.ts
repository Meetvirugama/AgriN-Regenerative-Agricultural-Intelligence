import { SoilProfile } from '../../models/Database';

export interface ParsedSoilData extends Partial<SoilProfile> {
  overall_confidence: number; // 0-100
  field_confidences: Record<string, number>; // per-field confidence 0-100
}

/**
 * Mocks the Gemini Multimodal AI call.
 * In production, this would take the image buffer, pass it to the vision model
 * with a prompt like "Extract soil texture, OM%, NPK levels, and pH from this report",
 * and return structured JSON.
 */
export class DocumentParser {
  public static async parseSoilReport(fileBuffer: Buffer): Promise<ParsedSoilData> {
    // Simulate network and processing latency (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // For demonstration, we simulate a 10% chance of a "blurry scan"
    const isBlurry = Math.random() < 0.1;

    if (isBlurry) {
      return {
        overall_confidence: 30, // Low overall confidence triggers a full retake
        field_confidences: {}
      };
    }

    return {
      overall_confidence: 88,
      field_confidences: {
        texture: 95,
        organic_matter_pct: 90,
        nitrogen_level: 95,
        phosphorus_level: 95,
        potassium_level: 95,
        water_holding_capacity: 90,
        ph: 45 // Simulate a low-confidence specific field (e.g. coffee stain over the pH number)
      },
      texture: 'clay_loam',
      organic_matter_pct: 4.2,
      nitrogen_level: 'high',
      phosphorus_level: 'medium',
      potassium_level: 'high',
      water_holding_capacity: 'high',
      ph: 6.5,
      report_date: new Date().toISOString().split('T')[0],
      source: 'lab_report',
    };
  }
}
