"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const escalation_service_1 = require("./escalation.service");
const router = (0, express_1.Router)();
// Trigger a new escalation (Farmer Side)
router.post('/trigger', (req, res) => {
    try {
        const { fieldId, reason, source, contextData } = req.body;
        if (!fieldId || !reason || !source) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const ticket = escalation_service_1.EscalationService.triggerEscalation(fieldId, reason, source, contextData);
        res.status(201).json(ticket);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to trigger escalation' });
    }
});
// Get pending tickets (Extension Worker Side)
router.get('/tickets', (req, res) => {
    try {
        const pending = escalation_service_1.EscalationService.getPendingTickets();
        res.json({ tickets: pending });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});
// Resolve a ticket
router.post('/tickets/:id/resolve', (req, res) => {
    try {
        const id = req.params.id;
        const resolved = escalation_service_1.EscalationService.resolveTicket(id);
        if (!resolved) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json(resolved);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to resolve ticket' });
    }
});
// Get regional heatmap/risk data
router.get('/regional-risk', (req, res) => {
    try {
        const risk = escalation_service_1.EscalationService.getRegionalRisk();
        res.json(risk);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch regional risk' });
    }
});
exports.default = router;
