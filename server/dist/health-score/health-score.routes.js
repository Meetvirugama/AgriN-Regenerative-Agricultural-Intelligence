"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_score_service_1 = require("./health-score.service");
const router = (0, express_1.Router)();
// GET /api/fields/:fieldId/health-score
router.get('/fields/:fieldId/health-score', async (req, res) => {
    const fieldId = req.params.fieldId;
    try {
        const score = await health_score_service_1.healthScoreService.computeScore(fieldId);
        res.json(score);
    }
    catch (error) {
        console.error('Error computing health score:', error);
        res.status(500).json({ error: 'Failed to compute health score' });
    }
});
// In a real system, there would be a POST endpoint or a scheduled cron job here
// that triggers the recompute and saves it to the database.
exports.default = router;
