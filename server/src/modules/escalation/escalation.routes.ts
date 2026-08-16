import { Router, Request, Response, NextFunction } from 'express';
import { EscalationService } from './escalation.service';

const router = Router();

// Trigger a new escalation (Farmer Side)
router.post('/trigger', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fieldId, reason, source, contextData } = req.body;
    if (!fieldId || !reason || !source) {
      res.status(400).json({ error: { message: 'Missing required fields: fieldId, reason, source' } });
      return;
    }
    const ticket = await EscalationService.triggerEscalation(fieldId, reason, source, contextData);
    res.status(201).json(ticket);
  } catch (err) { next(err); }
});

// Get pending tickets (Extension Worker Side)
router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = (page - 1) * limit;
    const pending = await EscalationService.getPendingTickets(limit, offset);
    res.json({ tickets: pending, page, limit });
  } catch (err) { next(err); }
});

// Resolve a ticket
router.post('/tickets/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EscalationService.resolveTicket(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Get regional heatmap/risk data
router.get('/regional-risk', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const risk = await EscalationService.getRegionalRisk();
    res.json(risk);
  } catch (err) { next(err); }
});

export default router;

