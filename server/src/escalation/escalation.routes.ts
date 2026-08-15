import { Router, Request, Response } from 'express';
import { EscalationService } from './escalation.service';

const router = Router();

// Trigger a new escalation (Farmer Side)
router.post('/trigger', (req: Request, res: Response) => {
  try {
    const { fieldId, reason, source, contextData } = req.body;
    
    if (!fieldId || !reason || !source) {
       return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket = EscalationService.triggerEscalation(fieldId, reason, source, contextData);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger escalation' });
  }
});

// Get pending tickets (Extension Worker Side)
router.get('/tickets', (req: Request, res: Response) => {
  try {
    const pending = EscalationService.getPendingTickets();
    res.json({ tickets: pending });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Resolve a ticket
router.post('/tickets/:id/resolve', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const resolved = EscalationService.resolveTicket(id);
    
    if (!resolved) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(resolved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve ticket' });
  }
});

// Get regional heatmap/risk data
router.get('/regional-risk', (req: Request, res: Response) => {
  try {
    const risk = EscalationService.getRegionalRisk();
    res.json(risk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch regional risk' });
  }
});

export default router;
