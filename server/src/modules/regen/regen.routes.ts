import { Router, Request, Response } from 'express';
import { layer10Service } from '../regen/regen.service';

const router = Router();

// GET /api/fields/:fieldId/regen/planning
router.get('/:fieldId/regen/planning', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    const plan = await layer10Service.getRegenPlan(fieldId);
    res.json(plan);
  } catch (error: any) {
    console.error("Regen Planning error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
