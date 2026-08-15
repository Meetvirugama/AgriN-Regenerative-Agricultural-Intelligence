"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer1Service = exports.Layer1Service = void 0;
const Database_1 = require("../models/Database");
class Layer1Service {
    /**
     * Stub to ensure a farmer exists for testing Layer 2.
     */
    getOrCreateMockFarmer() {
        const farmerId = 'farmer_mock_1';
        if (!Database_1.db.farmers.has(farmerId)) {
            const farmer = {
                id: farmerId,
                phone_number: '+1234567890',
                name: 'Meena',
                preferred_language: 'en',
                created_at: new Date().toISOString(),
            };
            Database_1.db.farmers.set(farmerId, farmer);
        }
        return Database_1.db.farmers.get(farmerId);
    }
    /**
     * Stub to register a field (so Layer 2 has something to work with)
     */
    registerField(farmerId, name, cropType, sowingDate) {
        const fieldId = `field_${Date.now()}`;
        const field = {
            id: fieldId,
            farmer_id: farmerId,
            name,
            crop_type: cropType,
            crop_variety: null,
            sowing_date: sowingDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        Database_1.db.fields.set(fieldId, field);
        return field;
    }
    getField(fieldId) {
        return Database_1.db.fields.get(fieldId);
    }
}
exports.Layer1Service = Layer1Service;
exports.layer1Service = new Layer1Service();
