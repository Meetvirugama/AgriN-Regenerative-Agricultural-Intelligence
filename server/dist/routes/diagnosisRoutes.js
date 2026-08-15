"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Layer7Service_1 = require("../services/Layer7Service");
const router = (0, express_1.Router)();
// POST /api/fields/:fieldId/diagnose
router.post('/:fieldId/diagnose', async (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        // In a real app, we'd use multer and parse the file. 
        // Here we just mock the blob size from the body to simulate different test cases.
        const { imageBlobSize } = req.body;
        const result = await Layer7Service_1.layer7Service.diagnoseCrop(fieldId, imageBlobSize || 1024);
        res.json(result);
    }
    catch (error) {
        console.error("Diagnosis error:", error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/fields/:fieldId/diagnoses
router.get('/:fieldId/diagnoses', async (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        const history = await Layer7Service_1.layer7Service.getDiagnosisHistory(fieldId);
        res.json({ history });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
