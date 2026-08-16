import { Router, Request, Response } from 'express';
import { CrossBorderService } from './crossBorder.service';

const router = Router();

// Get aggregated global insights for a specific field's context
router.get('/fields/:fieldId/global-insights', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    const insights = await CrossBorderService.getGlobalInsights(fieldId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cross-border insights' });
  }
});

export default router;
