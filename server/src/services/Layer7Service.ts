import { db, DiagnosisEvent } from '../models/Database';
import { layer1Service } from './Layer1Service';
import { layer2Service } from './Layer2Service';
import { layer3Service } from './Layer3Service';
import { layer6Service } from './Layer6Service';
import { diseaseAI } from './disease/DiseaseDiagnosticAI';
import { v4 as uuidv4 } from 'uuid';

export class Layer7Service {
  /**
   * Orchestrates the context gathering and triggers the AI diagnosis.
   */
  public async diagnoseCrop(fieldId: string, imageBlobSize: number): Promise<DiagnosisEvent> {
    // 1. Gather Context
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error('Field not found');

    const cropState = await layer2Service.getFieldCropState(fieldId);
    const weather = await layer3Service.getLocalizedForecast(fieldId);
    const fieldHealth = await layer6Service.getMockedFieldHealth(fieldId);

    // 2. Call AI with context
    const aiResult = await diseaseAI.analyzeImage(imageBlobSize, {
      crop_type: field.crop_type,
      growth_stage: cropState?.current_stage || 'unknown',
      recent_weather: weather,
      field_health: fieldHealth
    });

    // 3. Evaluate escalation logic
    // We escalate if confidence is low (<= 0.5) OR severity is high (regardless of confidence)
    const escalation_triggered = aiResult.predicted_category === 'unknown' || 
                                 aiResult.confidence <= 0.5 || 
                                 aiResult.severity === 'high';

    // 4. Save the event
    const event: DiagnosisEvent = {
      id: uuidv4(),
      field_id: fieldId,
      photo_url: 'mock_local_blob_url',
      submitted_at: new Date().toISOString(),
      crop_type: field.crop_type,
      growth_stage: cropState?.current_stage || 'unknown',
      recent_weather_snapshot: weather,
      field_health_context: fieldHealth,
      predicted_category: aiResult.predicted_category,
      predicted_label: aiResult.predicted_label,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      recommended_action_text: aiResult.recommended_action_text,
      escalation_triggered
    };

    const history = db.diagnosisEvents.get(fieldId) || [];
    history.push(event);
    db.diagnosisEvents.set(fieldId, history);

    return event;
  }

  public async getDiagnosisHistory(fieldId: string): Promise<DiagnosisEvent[]> {
    return db.diagnosisEvents.get(fieldId) || [];
  }
}

export const layer7Service = new Layer7Service();
