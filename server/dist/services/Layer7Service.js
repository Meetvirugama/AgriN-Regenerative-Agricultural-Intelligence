"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer7Service = exports.Layer7Service = void 0;
const Database_1 = require("../models/Database");
const Layer1Service_1 = require("./Layer1Service");
const Layer2Service_1 = require("./Layer2Service");
const Layer3Service_1 = require("./Layer3Service");
const Layer6Service_1 = require("./Layer6Service");
const DiseaseDiagnosticAI_1 = require("./disease/DiseaseDiagnosticAI");
const uuid_1 = require("uuid");
class Layer7Service {
    /**
     * Orchestrates the context gathering and triggers the AI diagnosis.
     */
    async diagnoseCrop(fieldId, imageBlobSize) {
        // 1. Gather Context
        const field = await Layer1Service_1.layer1Service.getField(fieldId);
        if (!field)
            throw new Error('Field not found');
        const cropState = await Layer2Service_1.layer2Service.getFieldCropState(fieldId);
        const weather = await Layer3Service_1.layer3Service.getLocalizedForecast(fieldId);
        const fieldHealth = await Layer6Service_1.layer6Service.getMockedFieldHealth(fieldId);
        // 2. Call AI with context
        const aiResult = await DiseaseDiagnosticAI_1.diseaseAI.analyzeImage(imageBlobSize, {
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
        const event = {
            id: (0, uuid_1.v4)(),
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
        const history = Database_1.db.diagnosisEvents.get(fieldId) || [];
        history.push(event);
        Database_1.db.diagnosisEvents.set(fieldId, history);
        return event;
    }
    async getDiagnosisHistory(fieldId) {
        return Database_1.db.diagnosisEvents.get(fieldId) || [];
    }
}
exports.Layer7Service = Layer7Service;
exports.layer7Service = new Layer7Service();
