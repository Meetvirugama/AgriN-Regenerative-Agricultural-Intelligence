import { DiagnosisEvent } from '../../models/Database';

export interface DiagnosticContext {
  crop_type: string;
  growth_stage: string;
  recent_weather: any;
  field_health: any;
}

export interface DiagnosticResult {
  predicted_category: DiagnosisEvent['predicted_category'];
  predicted_label: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high';
  recommended_action_text: string | null;
}

export class DiseaseDiagnosticAI {
  /**
   * Mocks a Gemini Multimodal AI call.
   * Expects an image blob (mocked as string buffer length or size here) and the structured context.
   */
  public async analyzeImage(imageBlobSize: number, context: DiagnosticContext): Promise<DiagnosticResult> {
    console.log(`[AI] Analyzing image of size ${imageBlobSize} with context:`, context.crop_type);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock logic based on file size to simulate different outcomes for testing
    
    // If the mock blob is exactly 999 bytes, trigger "unknown" (blurry photo)
    if (imageBlobSize === 999) {
      return {
        predicted_category: 'unknown',
        predicted_label: 'Unclear Image / Unknown Symptom',
        confidence: 0.2,
        severity: 'low',
        recommended_action_text: null
      };
    }

    // Default mock response: High confidence disease detection
    return {
      predicted_category: 'disease',
      predicted_label: 'Bacterial Leaf Blight',
      confidence: 0.92,
      severity: 'high',
      recommended_action_text: 'Apply copper-based bactericide immediately. Reduce irrigation to prevent spread in high humidity.'
    };
  }
}

export const diseaseAI = new DiseaseDiagnosticAI();
