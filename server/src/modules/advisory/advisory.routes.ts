import { Router, Request, Response } from 'express';

const router = Router();

// Endpoint to generate advisory via Python AI Service
router.get('/fields/:fieldId/advisory', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    
    // In a full implementation, we would pull these summaries from DB/services
    // For now, we provide context directly to the Python client to test the generation
    const { PythonClient } = await import('../../services/pythonClient');
    
    const advisory = await PythonClient.generateAdvisory(
      fieldId,
      "Wheat", // mock crop
      "Flowering", // mock stage
      "Slight decline in NDVI detected.", // mock health
      "Temperatures 3°C above average, no rain forecast.", // mock weather
      "Sandy loam, low water retention." // mock soil
    );

    // Map AI response to frontend expected format
    const formattedAdvisory = {
      id: `adv-${Date.now()}`,
      field_id: fieldId,
      generated_at: new Date().toISOString(),
      trigger: 'ai_generated',
      what_text: advisory.crop_health_status,
      why_text: advisory.weather_impact,
      severity: 'Medium',
      action_text: advisory.irrigation_advice + " " + advisory.nutrient_management,
      action_deadline: 'Within 3 days',
      monitor_text: advisory.pest_disease_risks,
      source_layers: ['Layer 02', 'Layer 03', 'Layer 04', 'Layer 05', 'Layer 09'],
      farmer_response: null,
      overridden_reason: null,
      historical_parallel_callout: advisory.regenerative_practice
    };

    res.json(formattedAdvisory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
