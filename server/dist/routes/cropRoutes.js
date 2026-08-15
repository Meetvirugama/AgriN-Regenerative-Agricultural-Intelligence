"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropRoutes = void 0;
const express_1 = require("express");
const Layer2Service_1 = require("../services/Layer2Service");
const Layer1Service_1 = require("../services/Layer1Service");
const router = (0, express_1.Router)();
// Minimal Layer 1 stub endpoints to get a field to work with
router.post('/stub-init', (req, res) => {
    const farmer = Layer1Service_1.layer1Service.getOrCreateMockFarmer();
    // Register a field sown 45 days ago
    const date45DaysAgo = new Date();
    date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);
    const field = Layer1Service_1.layer1Service.registerField(farmer.id, 'Main Plot', 'wheat', date45DaysAgo.toISOString());
    res.json({ farmer, field });
});
// GET /api/fields/:fieldId/crop-state
router.get('/:fieldId/crop-state', (req, res) => {
    try {
        const state = Layer2Service_1.layer2Service.getFieldCropState(req.params.fieldId);
        res.json(state);
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
});
// POST /api/fields/:fieldId/identify-crop
router.post('/:fieldId/identify-crop', (req, res) => {
    try {
        // In a real app we'd parse multipart/form-data for the image
        const result = Layer2Service_1.layer2Service.identifyCrop(req.params.fieldId, req.body.image);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/fields/:fieldId/override-stage
router.post('/:fieldId/override-stage', (req, res) => {
    try {
        const { cropType, variety, stage } = req.body;
        const newState = Layer2Service_1.layer2Service.overrideCropState(req.params.fieldId, cropType, variety, stage);
        res.json(newState);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.cropRoutes = router;
