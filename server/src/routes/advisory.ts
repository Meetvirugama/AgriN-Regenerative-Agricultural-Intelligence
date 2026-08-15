import { Router, Request, Response } from 'express';

const router = Router();

// Mock data for AI Agro-Advisory reasoning engine
router.get('/fields/:fieldId/advisory', (req: Request, res: Response) => {
  const { fieldId } = req.params;

  // Mocking the AI reasoning output based on the Layer 09 requirements
  // Following the six-question structure: what/why/how serious/what to do/when/what to monitor
  const mockAdvisory = {
    id: `adv-${Date.now()}`,
    field_id: fieldId,
    generated_at: new Date().toISOString(),
    trigger: 'scheduled',
    what_text: 'Your wheat crop is showing severe signs of heat stress and potential blight.',
    why_text: 'Temperatures have been 3°C above average for the past week, and satellite imagery shows a rapid drop in canopy moisture.',
    severity: 'High',
    action_text: 'Immediate intervention required. Apply targeted fungicide and increase irrigation by 30%.',
    action_deadline: 'Within the next 24 hours',
    monitor_text: 'Watch for rapid spreading of yellowing on the lower leaves. If it spreads, escalate immediately.',
    source_layers: ['Layer 02 (Stage)', 'Layer 03 (Weather)', 'Layer 05 (Satellite)'],
    farmer_response: null,
    overridden_reason: null
  };

  res.json(mockAdvisory);
});

// Endpoint to record farmer response
router.post('/fields/:fieldId/advisory/response', (req: Request, res: Response) => {
  const { fieldId } = req.params;
  const { advisoryId, action, reason } = req.body;

  // In a real application, save to DB here
  console.log(`Received farmer response for advisory ${advisoryId} on field ${fieldId}: ${action} - ${reason || 'No reason'}`);

  res.json({ success: true, message: 'Feedback recorded successfully' });
});

export default router;
