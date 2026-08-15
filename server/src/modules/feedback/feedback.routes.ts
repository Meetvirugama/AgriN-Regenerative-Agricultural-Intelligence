import { Router, Request, Response } from 'express';
import { FieldTimelineEntry } from '../../models/Feedback';

const router = Router();

// Mock database
let feedbackRecords: any[] = [];
let pendingFeedbackPrompts = [
  {
    id: `prompt-${Date.now()}`,
    advisory_id: 'adv-123',
    field_id: 'field-1',
    prompted_at: new Date().toISOString(),
    summary: 'You applied extra irrigation last week.'
  } // Initial mock prompt
];

router.post('/feedback', (req: Request, res: Response) => {
  const { advisory_id, field_id, farmer_response, follow_up_note, follow_up_photo_url } = req.body;
  
  const record = {
    id: `fb-${Date.now()}`,
    advisory_id,
    field_id,
    prompted_at: new Date().toISOString(),
    farmer_response,
    follow_up_photo_url: follow_up_photo_url || null,
    follow_up_note: follow_up_note || null,
    collected_at: new Date().toISOString()
  };
  
  feedbackRecords.push(record);
  
  // Remove from pending prompts
  pendingFeedbackPrompts = pendingFeedbackPrompts.filter(p => p.advisory_id !== advisory_id);

  res.json({ success: true, record });
});

router.get('/feedback/pending/:field_id', (req: Request, res: Response) => {
  res.json({ prompts: pendingFeedbackPrompts });
});

// Mock timeline endpoint
router.get('/timeline/:field_id', (req: Request, res: Response) => {
  const mockTimeline: FieldTimelineEntry[] = [
    {
      id: 'tl-1',
      field_id: req.params.field_id as string,
      date: new Date().toISOString(),
      entry_type: 'weather_event',
      summary_text: 'Heavy rainfall event (45mm)',
      linked_record_id: 'we-1',
      season_label: 'This Season'
    },
    {
      id: 'tl-2',
      field_id: req.params.field_id as string,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      entry_type: 'advisory',
      summary_text: 'Applied Zinc sulfate to address deficiency',
      linked_record_id: 'adv-456',
      season_label: 'This Season'
    },
    {
      id: 'tl-3',
      field_id: req.params.field_id as string,
      date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // ~5 months ago
      entry_type: 'satellite_anomaly',
      summary_text: 'Severe heat stress detected in Northeast corner',
      linked_record_id: 'sat-789',
      season_label: 'Last Season'
    }
  ];
  
  res.json({ timeline: mockTimeline });
});

// Mock Scheduled Jobs Endpoint (To be triggered manually or by a cron)
router.post('/jobs/trigger-feedback-prompts', (req: Request, res: Response) => {
  res.json({ message: 'Checked for stale advisories. Created 0 new prompts.' });
});

router.post('/jobs/verify-outcomes', (req: Request, res: Response) => {
  res.json({ message: 'Ran satellite outcome verification on 0 active advisories.' });
});

export default router;
