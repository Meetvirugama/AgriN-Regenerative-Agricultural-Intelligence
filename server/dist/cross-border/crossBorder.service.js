"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossBorderService = void 0;
class CrossBorderService {
    static getGlobalInsights(fieldId) {
        // In a real application, this would use Layer 09/14 logic to map the local field's
        // climate zone and crop type against anonymized data from other countries.
        const mockInsights = [
            {
                id: `cbi-${Date.now()}-1`,
                insightType: 'practice',
                sourceRegion: 'Kenya (Rift Valley)',
                comparableClimateZone: 'Semi-Arid Tropics',
                recommendation: 'Switch to a 3-week cover crop rotation between wheat cycles to retain 15% more soil moisture during peak dry spells.',
                confidenceScore: 0.89,
                adoptionRate: 64
            },
            {
                id: `cbi-${Date.now()}-2`,
                insightType: 'risk_model',
                sourceRegion: 'Brazil (Mato Grosso)',
                comparableClimateZone: 'Tropical Savanna',
                recommendation: 'Early-warning models suggest current humidity patterns precede severe rust outbreaks within 14 days. Pre-emptive fungicide application recommended.',
                confidenceScore: 0.92,
                adoptionRate: 81
            }
        ];
        return {
            fieldId,
            insights: mockInsights
        };
    }
}
exports.CrossBorderService = CrossBorderService;
