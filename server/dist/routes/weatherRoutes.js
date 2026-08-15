"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Layer3Service_1 = require("../services/Layer3Service");
const router = (0, express_1.Router)();
// GET /api/fields/:fieldId/weather/forecast
router.get('/:fieldId/weather/forecast', async (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        // In a real system, we'd serve cached forecasts and a background job would fetch.
        // For MVP, if it doesn't exist, we fetch it immediately (on-demand cache).
        let data = Layer3Service_1.layer3Service.getLocalizedForecast(fieldId);
        if (data.forecasts.length === 0) {
            data = await Layer3Service_1.layer3Service.fetchAndStoreForecast(fieldId);
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/fields/:fieldId/weather/history
router.get('/:fieldId/weather/history', async (req, res) => {
    try {
        const history = await Layer3Service_1.layer3Service.getFieldWeatherHistory(req.params.fieldId);
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
