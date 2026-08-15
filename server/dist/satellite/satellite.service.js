"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satelliteService = exports.SatelliteService = void 0;
const satellite_provider_1 = require("./satellite.provider");
const satellite_store_1 = require("./satellite.store");
class SatelliteService {
    provider;
    constructor() {
        // In production, we'd inject this via DI. Using mock for now.
        this.provider = new satellite_provider_1.MockSatelliteProvider();
    }
    async ingestLatestForField(fieldId, fieldBoundary) {
        // 1. Fetch latest tile
        const newTile = await this.provider.fetchLatestTile(fieldBoundary, fieldId);
        if (!newTile)
            return;
        await satellite_store_1.satelliteStore.saveTile(newTile);
        // If cloudy, we skip trend/anomaly calculation on this pass
        if (newTile.cloudCoverPct >= 50)
            return;
        // 2. Fetch history for trend calculation
        const history = await satellite_store_1.satelliteStore.getHistoricalTiles(fieldId, 3);
        // 3. Compute Trend
        await this.computeAndSaveTrend(fieldId, newTile, history);
        // 4. Detect Anomalies
        await this.detectAnomalies(fieldId, newTile, history);
    }
    async computeAndSaveTrend(fieldId, currentTile, history) {
        let ndviTrendDirection = 'stable';
        let moistureTrend = 'stable';
        if (history.length > 1) {
            const prevTile = history[1]; // [0] is often the current one depending on when we fetch history vs save, but let's assume [1] is previous for this logic
            const ndviDiff = currentTile.ndviMean - prevTile.ndviMean;
            if (ndviDiff > 0.05)
                ndviTrendDirection = 'improving';
            else if (ndviDiff < -0.05)
                ndviTrendDirection = 'declining';
            const moistureDiff = currentTile.moistureProxy - prevTile.moistureProxy;
            if (moistureDiff > 0.05)
                moistureTrend = 'improving';
            else if (moistureDiff < -0.05)
                moistureTrend = 'declining';
        }
        let summaryText = 'Conditions are stable.';
        if (ndviTrendDirection === 'improving') {
            summaryText = 'Greener than last week.';
        }
        else if (ndviTrendDirection === 'declining') {
            summaryText = 'Slight vegetation decline observed.';
        }
        const trend = {
            fieldId,
            date: currentTile.captureDate,
            ndviTrendDirection,
            moistureTrend,
            ndviValue: currentTile.ndviMean,
            moistureValue: currentTile.moistureProxy,
            summaryText,
            computedAt: new Date().toISOString()
        };
        await satellite_store_1.satelliteStore.saveTrend(trend);
    }
    async detectAnomalies(fieldId, currentTile, history) {
        // Rule-based v1: If any subregion drops > 15% vs its history, flag it.
        if (history.length < 2)
            return;
        const prevTile = history[1];
        for (const currentSub of currentTile.ndviBySubregion) {
            const prevSub = prevTile.ndviBySubregion.find(s => s.subregionId === currentSub.subregionId);
            if (prevSub) {
                const dropPct = (prevSub.ndvi - currentSub.ndvi) / prevSub.ndvi;
                if (dropPct > 0.15) { // 15% drop
                    const severity = dropPct > 0.25 ? 'high' : 'moderate';
                    const anomaly = {
                        id: `anomaly-${Date.now()}-${currentSub.subregionId}`,
                        fieldId,
                        subregionGeometry: currentSub.geometry,
                        subregionLabel: currentSub.label,
                        detectedDate: currentTile.captureDate,
                        anomalyType: 'vegetation_decline',
                        severity,
                        stillActive: true,
                        resolvedDate: null
                    };
                    await satellite_store_1.satelliteStore.saveAnomaly(anomaly);
                }
            }
        }
    }
}
exports.SatelliteService = SatelliteService;
exports.satelliteService = new SatelliteService();
