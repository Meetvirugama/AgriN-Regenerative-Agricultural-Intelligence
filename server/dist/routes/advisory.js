"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Mock data for AI Agro-Advisory reasoning engine
router.get('/fields/:fieldId/advisory', (req, res) => {
    const { fieldId } = req.params;
    // Mocking the AI reasoning output based on the Layer 09 requirements
    // Following the six-question structure: what/why/how serious/what to do/when/what to monitor
    const mockAdvisory = {
        id: `adv-${Date.now()}`,
        field_id: fieldId,
        generated_at: new Date().toISOString(),
        trigger: 'scheduled',
        what_text: 'Your wheat crop is showing early signs of heat stress.',
        why_text: 'Temperatures have been 3°C above average for the past week, and satellite imagery shows a slight dip in canopy moisture.',
        severity: 'Medium',
        action_text: 'Increase irrigation duration by 20% during your next watering cycle.',
        action_deadline: 'Within the next 48 hours',
        monitor_text: 'Watch for yellowing on the lower leaves, which could indicate the stress is continuing.',
        source_layers: ['Layer 02 (Stage)', 'Layer 03 (Weather)', 'Layer 05 (Satellite)'],
        farmer_response: null,
        overridden_reason: null
    };
    res.json(mockAdvisory);
});
// Endpoint to record farmer response
router.post('/fields/:fieldId/advisory/response', (req, res) => {
    const { fieldId } = req.params;
    const { advisoryId, action, reason } = req.body;
    // In a real application, save to DB here
    console.log(`Received farmer response for advisory ${advisoryId} on field ${fieldId}: ${action} - ${reason || 'No reason'}`);
    res.json({ success: true, message: 'Feedback recorded successfully' });
});
exports.default = router;
