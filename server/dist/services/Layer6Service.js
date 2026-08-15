"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer6Service = exports.Layer6Service = void 0;
class Layer6Service {
    /**
     * Stubs the Layer 06 context for use by Layer 07.
     * This provides the structured explanation of field conditions.
     */
    async getMockedFieldHealth(fieldId) {
        return {
            field_id: fieldId,
            computed_at: new Date().toISOString(),
            crop_health: { value: 'moderate', severity: 'amber', basis: ['Recent heat wave stress', 'Vegetation slightly below average'] },
            water_condition: { value: 'dry', severity: 'amber', basis: ['No rain in 7 days', 'Soil moisture low'] },
            soil_condition: { value: 'good', severity: 'green', basis: ['NPK levels optimal', 'pH balanced'] },
            weather_risk: { value: 'moderate', severity: 'amber', basis: ['Heat warning active'] },
            disease_risk: { value: 'low', severity: 'green', basis: ['Low humidity reduces fungal risk'] },
            climate_stress: { value: 'high', severity: 'red', basis: ['Persistent high temperatures'] },
            vegetation_trend: { value: 'declining', severity: 'amber', basis: ['NDVI dipped by 15% last week'] },
            synthesis_text: 'Field is experiencing moderate heat stress and declining vegetation, but soil health remains stable.'
        };
    }
}
exports.Layer6Service = Layer6Service;
exports.layer6Service = new Layer6Service();
