"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer10Service = exports.Layer10Service = void 0;
const Database_1 = require("../models/Database");
const Layer1Service_1 = require("./Layer1Service");
const Layer4Service_1 = require("./Layer4Service");
const RegenAI_1 = require("./regen/RegenAI");
class Layer10Service {
    /**
     * Orchestrates the context gathering and triggers the Regen AI.
     */
    async getRegenPlan(fieldId) {
        // Return cached plan if it exists
        const existing = Database_1.db.regenPlans.get(fieldId);
        if (existing) {
            return existing;
        }
        const field = await Layer1Service_1.layer1Service.getField(fieldId);
        if (!field)
            throw new Error('Field not found');
        const latestSoil = Layer4Service_1.layer4Service.getActiveSoilProfile(fieldId);
        // Mock Field History (Layer 12 substitute)
        const mockHistory = [
            { season: 'Kharif 2025', crop: 'Rice', yield: 'Average' },
            { season: 'Rabi 2024', crop: 'Wheat', yield: 'High' }
        ];
        const context = {
            crop_type: field.crop_type,
            soil: latestSoil,
            history: mockHistory
        };
        const aiResult = await RegenAI_1.regenAI.generatePlan(context);
        const plan = {
            field_id: fieldId,
            practices: aiResult.practices,
            next_season_options: aiResult.next_season_options,
            generated_at: new Date().toISOString()
        };
        Database_1.db.regenPlans.set(fieldId, plan);
        return plan;
    }
}
exports.Layer10Service = Layer10Service;
exports.layer10Service = new Layer10Service();
