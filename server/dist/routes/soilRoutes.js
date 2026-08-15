"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Layer4Service_1 = require("../services/Layer4Service");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// GET /api/fields/:fieldId/soil
router.get('/:fieldId/soil', (req, res) => {
    try {
        const profile = Layer4Service_1.layer4Service.getActiveSoilProfile(req.params.fieldId);
        if (!profile) {
            return res.status(404).json({ error: 'No soil data available.' });
        }
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/fields/:fieldId/soil/parse
router.post('/:fieldId/soil/parse', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Document required' });
        }
        const parsedData = await Layer4Service_1.layer4Service.parseLabReport(req.params.fieldId, req.file.buffer);
        res.json(parsedData);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/fields/:fieldId/soil/save
router.post('/:fieldId/soil/save', (req, res) => {
    try {
        const profile = Layer4Service_1.layer4Service.saveSoilProfile(req.params.fieldId, req.body);
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
