import { Router, Request, Response } from 'express';
import { healthScoreService } from './health-score.service';

const router = Router();

// GET /api/fields/:fieldId/health-score
router.get('/fields/:fieldId/health-score', async (req: Request, res: Response) => {
  const fieldId = req.params.fieldId as string;
  
  try {
    const score = await healthScoreService.computeScore(fieldId);
    res.json(score);
  } catch (error) {
    console.error('Error computing health score:', error);
    res.status(500).json({ error: 'Failed to compute health score' });
  }
});

// In a real system, there would be a POST endpoint or a scheduled cron job here
// that triggers the recompute and saves it to the database.

export default router;
