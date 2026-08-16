import { Router, Request, Response, NextFunction } from 'express';
import { feedbackRepo, timelineRepo } from '../../db/repositories/feedbackRepository';

const router = Router();

/**
 * POST /api/feedback
 * Record a farmer's feedback response on an advisory.
 */
router.post('/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { advisory_id, field_id, farmer_response, follow_up_note, follow_up_photo_url } = req.body;

    if (!field_id || !farmer_response) {
      res.status(400).json({ error: { message: 'field_id and farmer_response are required' } });
      return;
    }

    const record = await feedbackRepo.saveFeedback({
      advisory_id: advisory_id ?? null,
      field_id,
      farmer_response,
      follow_up_photo_url: follow_up_photo_url ?? null,
      follow_up_note: follow_up_note ?? null,
      collected_at: new Date().toISOString(),
    });

    // Write a timeline entry for this feedback
    await timelineRepo.addEntry({
      field_id,
      entry_date: new Date().toISOString(),
      entry_type: 'advisory',
      summary_text: `Farmer responded: "${farmer_response}" to advisory`,
      linked_record_id: advisory_id ?? null,
      season_label: 'This Season',
    });

    res.json({ success: true, record });
  } catch (err) { next(err); }
});

/**
 * GET /api/feedback/pending/:field_id
 * Returns pending feedback prompts for a field (unanswered advisory responses).
 */
router.get('/feedback/pending/:field_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompts = await feedbackRepo.getPendingPrompts(req.params.field_id as string);
    res.json({ prompts });
  } catch (err) { next(err); }
});

/**
 * GET /api/timeline/:field_id
 * Returns the field's event history in reverse-chronological order.
 */
router.get('/timeline/:field_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await timelineRepo.getTimeline(req.params.field_id as string);
    res.json({ timeline: entries });
  } catch (err) { next(err); }
});

/**
 * POST /api/jobs/trigger-feedback-prompts
 * Background job endpoint — checks for advisories older than N days with no response.
 */
router.post('/jobs/trigger-feedback-prompts', async (_req: Request, res: Response) => {
  // Phase 5: implement stale advisory detection and create feedback_events rows
  res.json({ message: 'Checked for stale advisories. Job not yet implemented — see Phase 5.' });
});

/**
 * POST /api/jobs/verify-outcomes
 * Background job endpoint — satellite-based outcome verification.
 */
router.post('/jobs/verify-outcomes', async (_req: Request, res: Response) => {
  // Phase 5: implement satellite change detection comparison
  res.json({ message: 'Satellite outcome verification: not yet implemented — see Phase 5.' });
});

export default router;

