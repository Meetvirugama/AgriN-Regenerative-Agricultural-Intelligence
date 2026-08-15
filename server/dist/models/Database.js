"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.InMemoryDB = void 0;
// In-Memory Store
class InMemoryDB {
    farmers = new Map();
    fields = new Map();
    cropCalendars = new Map();
    fieldCropStates = new Map();
    overrideEvents = [];
    weatherSnapshots = new Map();
    weatherFlags = new Map();
    constructor() {
        this.seed();
    }
    seed() {
        // Seed Crop Calendar Data
        this.cropCalendars.set('wheat_punjab', {
            id: 'wheat_punjab',
            crop_type: 'wheat',
            region: 'punjab',
            stages: [
                { stage: 'germination', gdd_threshold: 0, typical_days: [0, 7] },
                { stage: 'vegetative', gdd_threshold: 150, typical_days: [8, 60] },
                { stage: 'flowering', gdd_threshold: 600, typical_days: [61, 90] },
                { stage: 'maturity', gdd_threshold: 1200, typical_days: [91, 140] }
            ]
        });
        this.cropCalendars.set('rice_punjab', {
            id: 'rice_punjab',
            crop_type: 'rice',
            region: 'punjab',
            stages: [
                { stage: 'germination', gdd_threshold: 0, typical_days: [0, 10] },
                { stage: 'vegetative', gdd_threshold: 200, typical_days: [11, 70] },
                { stage: 'flowering', gdd_threshold: 800, typical_days: [71, 100] },
                { stage: 'maturity', gdd_threshold: 1500, typical_days: [101, 150] }
            ]
        });
        this.cropCalendars.set('maize_punjab', {
            id: 'maize_punjab',
            crop_type: 'maize',
            region: 'punjab',
            stages: [
                { stage: 'germination', gdd_threshold: 0, typical_days: [0, 8] },
                { stage: 'vegetative', gdd_threshold: 180, typical_days: [9, 50] },
                { stage: 'flowering', gdd_threshold: 700, typical_days: [51, 80] },
                { stage: 'maturity', gdd_threshold: 1300, typical_days: [81, 120] }
            ]
        });
    }
}
exports.InMemoryDB = InMemoryDB;
exports.db = new InMemoryDB();
