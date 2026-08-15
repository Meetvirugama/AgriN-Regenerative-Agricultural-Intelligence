"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satelliteStore = exports.SatelliteStore = void 0;
class SatelliteStore {
    tiles = [];
    trends = [];
    anomalies = [];
    // Seed with some mock data for development
    constructor() {
        this.seedMockData();
    }
    seedMockData() {
        const fieldId1 = 'mock-field-1'; // Assume we have this from Layer 01
        // Seed anomaly
        this.anomalies.push({
            id: 'anomaly-1',
            fieldId: fieldId1,
            subregionGeometry: { type: 'Polygon', coordinates: [] },
            subregionLabel: 'Northeast corner',
            detectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            anomalyType: 'vegetation_decline',
            severity: 'moderate',
            stillActive: true,
            resolvedDate: null,
        });
    }
    async saveTile(tile) {
        this.tiles.push(tile);
    }
    async getLatestTile(fieldId) {
        const fieldTiles = this.tiles
            .filter(t => t.fieldId === fieldId && t.cloudCoverPct < 50) // Only clear-ish tiles
            .sort((a, b) => new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime());
        return fieldTiles[0] || null;
    }
    async getHistoricalTiles(fieldId, limit = 5) {
        return this.tiles
            .filter(t => t.fieldId === fieldId)
            .sort((a, b) => new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime())
            .slice(0, limit);
    }
    async saveTrend(trend) {
        this.trends.push(trend);
    }
    async getLatestTrend(fieldId) {
        const fieldTrends = this.trends
            .filter(t => t.fieldId === fieldId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return fieldTrends[0] || null;
    }
    async getTrendsTime_series(fieldId) {
        return this.trends
            .filter(t => t.fieldId === fieldId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending for chart
    }
    async saveAnomaly(anomaly) {
        this.anomalies.push(anomaly);
    }
    async getActiveAnomalies(fieldId) {
        return this.anomalies.filter(a => a.fieldId === fieldId && a.stillActive);
    }
    async getAllAnomalies(fieldId) {
        return this.anomalies.filter(a => a.fieldId === fieldId);
    }
}
exports.SatelliteStore = SatelliteStore;
exports.satelliteStore = new SatelliteStore();
