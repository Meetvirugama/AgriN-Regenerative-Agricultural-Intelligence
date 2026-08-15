"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crossBorder_service_1 = require("./crossBorder.service");
const router = (0, express_1.Router)();
// Get aggregated global insights for a specific field's context
router.get('/fields/:fieldId/global-insights', (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        const insights = crossBorder_service_1.CrossBorderService.getGlobalInsights(fieldId);
        res.json(insights);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch cross-border insights' });
    }
});
exports.default = router;
