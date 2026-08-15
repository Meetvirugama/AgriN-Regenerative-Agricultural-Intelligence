"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const satellite_store_1 = require("./satellite.store");
const satellite_service_1 = require("./satellite.service");
const router = (0, express_1.Router)();
// GET /api/fields/:fieldId/satellite/latest
router.get('/fields/:fieldId/satellite/latest', async (req, res) => {
    const fieldId = req.params.fieldId;
    const latestTile = await satellite_store_1.satelliteStore.getLatestTile(fieldId);
    const latestTrend = await satellite_store_1.satelliteStore.getLatestTrend(fieldId);
    const activeAnomalies = await satellite_store_1.satelliteStore.getActiveAnomalies(fieldId);
    res.json({
        latestTile,
        trend: latestTrend,
        activeAnomalies
    });
});
// GET /api/fields/:fieldId/satellite/timeline
router.get('/fields/:fieldId/satellite/timeline', async (req, res) => {
    const fieldId = req.params.fieldId;
    const timeline = await satellite_store_1.satelliteStore.getTrendsTime_series(fieldId);
    res.json({ timeline });
});
// GET /api/fields/:fieldId/satellite/anomalies
router.get('/fields/:fieldId/satellite/anomalies', async (req, res) => {
    const fieldId = req.params.fieldId;
    const anomalies = await satellite_store_1.satelliteStore.getAllAnomalies(fieldId);
    res.json({ anomalies });
});
// POST /api/satellite/ingest
router.post('/satellite/ingest', async (req, res) => {
    const { fieldId, boundary } = req.body;
    if (!fieldId) {
        return res.status(400).json({ error: 'fieldId is required' });
    }
    // boundary could be null in this mock, we just pass what we get
    await satellite_service_1.satelliteService.ingestLatestForField(fieldId, boundary || { type: 'Polygon', coordinates: [] });
    res.json({ success: true, message: 'Ingestion triggered' });
});
exports.default = router;
