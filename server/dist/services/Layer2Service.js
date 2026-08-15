"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer2Service = exports.Layer2Service = void 0;
const Database_1 = require("../models/Database");
const Layer1Service_1 = require("./Layer1Service");
class Layer2Service {
    /**
     * Stub function to calculate GDD since sowing date.
     * Assumes 15 GDD accumulated per day on average for this mock.
     */
    calculateAccumulatedGDD(sowingDate) {
        const sowing = new Date(sowingDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - sowing.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // Stub: 15 GDD per day
        return diffDays * 15;
    }
    /**
     * Returns the correct stage based on accumulated GDD and the crop calendar.
     */
    inferStageFromGDD(gdd, calendar) {
        // Sort stages by threshold ascending
        const sortedStages = [...calendar.stages].sort((a, b) => a.gdd_threshold - b.gdd_threshold);
        let currentStage = sortedStages[0].stage;
        for (const stage of sortedStages) {
            if (gdd >= stage.gdd_threshold) {
                currentStage = stage.stage;
            }
            else {
                break;
            }
        }
        return currentStage;
    }
    getStageDescription(stage, cropType) {
        const descriptions = {
            wheat: {
                germination: 'Ensure soil remains moist but not waterlogged.',
                vegetative: 'Focus on nitrogen application and weed control.',
                flowering: 'Critical period for water stress. Avoid chemical spraying if possible.',
                maturity: 'Monitor for harvest readiness and dry conditions.'
            },
            rice: {
                germination: 'Keep fields flooded but allow tips to breathe.',
                vegetative: 'Top dress nitrogen and monitor for stem borers.',
                flowering: 'Maintain water level. High disease vulnerability period.',
                maturity: 'Drain field gradually to prepare for harvest.'
            },
            maize: {
                germination: 'Protect from early pests and birds.',
                vegetative: 'Critical period for nitrogen uptake.',
                flowering: 'Silking stage. Highly sensitive to heat and drought.',
                maturity: 'Black layer forming. Monitor grain moisture.'
            }
        };
        return descriptions[cropType]?.[stage] || 'Monitor field regularly.';
    }
    getFieldCropState(fieldId) {
        const field = Layer1Service_1.layer1Service.getField(fieldId);
        if (!field) {
            throw new Error(`Field not found: ${fieldId}`);
        }
        const existingState = Database_1.db.fieldCropStates.get(fieldId);
        if (existingState && existingState.last_updated_from === 'farmer_override') {
            return existingState;
        }
        const calendarKey = `${field.crop_type}_punjab`;
        const calendar = Database_1.db.cropCalendars.get(calendarKey);
        if (!calendar) {
            throw new Error(`Crop calendar not found for ${field.crop_type} in region punjab`);
        }
        const gdd = this.calculateAccumulatedGDD(field.sowing_date);
        const inferredStage = this.inferStageFromGDD(gdd, calendar);
        const newState = {
            field_id: fieldId,
            confirmed_crop: field.crop_type,
            confirmed_variety: field.crop_variety,
            current_stage: inferredStage,
            stage_description: this.getStageDescription(inferredStage, field.crop_type),
            stage_confidence: 'high',
            stage_conflict: existingState ? existingState.stage_conflict : false,
            accumulated_gdd: gdd,
            last_updated_from: 'calendar_estimate',
            updated_at: new Date().toISOString()
        };
        Database_1.db.fieldCropStates.set(fieldId, newState);
        return newState;
    }
    identifyCrop(fieldId, _imageBlob) {
        // Mocking Gemini Vision output
        return {
            crop: 'wheat',
            variety: 'HD2967',
            confidence: 'high', // Use high/moderate/low
        };
    }
    overrideCropState(fieldId, cropType, variety, stage) {
        const existingState = this.getFieldCropState(fieldId);
        const updatedState = {
            ...existingState,
            confirmed_crop: cropType || existingState.confirmed_crop,
            confirmed_variety: variety || existingState.confirmed_variety,
            current_stage: stage || existingState.current_stage,
            stage_description: this.getStageDescription(stage || existingState.current_stage, cropType || existingState.confirmed_crop),
            last_updated_from: 'farmer_override',
            stage_conflict: false, // reset conflict on explicit override
            updated_at: new Date().toISOString()
        };
        Database_1.db.fieldCropStates.set(fieldId, updatedState);
        // Log the override as a distinct event (for Layer 12)
        Database_1.db.overrideEvents.push({
            id: `override_${Date.now()}`,
            field_id: fieldId,
            previous_crop: existingState.confirmed_crop,
            new_crop: updatedState.confirmed_crop,
            previous_stage: existingState.current_stage,
            new_stage: updatedState.current_stage,
            timestamp: new Date().toISOString()
        });
        // If crop changed, update Layer 1 field
        const field = Layer1Service_1.layer1Service.getField(fieldId);
        if (field && cropType) {
            field.crop_type = cropType;
            field.updated_at = new Date().toISOString();
        }
        return updatedState;
    }
}
exports.Layer2Service = Layer2Service;
exports.layer2Service = new Layer2Service();
