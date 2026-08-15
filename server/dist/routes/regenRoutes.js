"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Layer10Service_1 = require("../services/Layer10Service");
const router = (0, express_1.Router)();
// GET /api/fields/:fieldId/regen/planning
router.get('/:fieldId/regen/planning', async (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        const plan = await Layer10Service_1.layer10Service.getRegenPlan(fieldId);
        res.json(plan);
    }
    catch (error) {
        console.error("Regen Planning error:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
