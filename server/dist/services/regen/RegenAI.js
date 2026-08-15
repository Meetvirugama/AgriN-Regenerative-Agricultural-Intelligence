"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenAI = exports.RegenAI = void 0;
class RegenAI {
    /**
     * Mocks a Gemini AI call for regenerative practices and crop planning.
     * In reality, this would prompt a LLM with the field's soil, crop history, and climate.
     */
    async generatePlan(context) {
        console.log('[AI] Generating regenerative plan for context:', context.crop_type);
        // Simulate AI delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        const practices = [
            {
                id: 'p1',
                title: 'Plant Legume Cover Crop',
                description: 'Sow cowpea or clover immediately after the current harvest.',
                effort_level: 'medium',
                reasoning: 'Your field history shows 3 continuous seasons of cereals. A legume cover crop will break the pest cycle and naturally fix nitrogen, saving fertilizer costs next season.'
            },
            {
                id: 'p2',
                title: 'Reduced Tillage',
                description: 'Minimize soil disturbance during the next field preparation.',
                effort_level: 'low',
                reasoning: 'Your soil profile indicates moderate organic matter. Reducing tillage will help retain moisture during the upcoming dry season and build soil structure.'
            }
        ];
        const next_season_options = [
            {
                crop_type: 'Soybean',
                variety: 'Drought-Tolerant DS-21',
                suitability_score: 92,
                reasoning: 'Excellent rotation match after Wheat. Rebuilds soil nitrogen and matches the forecasted drier-than-average season.',
                risk_factors: ['Requires timely early-season weeding']
            },
            {
                crop_type: 'Cotton',
                variety: 'BT Cotton',
                suitability_score: 75,
                reasoning: 'High cash value, but requires more intense pest management. Soil pH (6.8) is optimal.',
                risk_factors: ['High water requirement during flowering', 'Pest pressure high in your region']
            },
            {
                crop_type: 'Rice',
                variety: 'Basmati',
                suitability_score: 45,
                reasoning: 'Not recommended. Your soil moisture retention is currently low and the seasonal forecast predicts a 20% rainfall deficit.',
                risk_factors: ['Severe water stress risk', 'High pumping costs']
            }
        ];
        return { practices, next_season_options };
    }
}
exports.RegenAI = RegenAI;
exports.regenAI = new RegenAI();
