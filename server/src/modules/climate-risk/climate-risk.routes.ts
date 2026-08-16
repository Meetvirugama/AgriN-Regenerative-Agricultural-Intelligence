import { Router, Request, Response } from 'express';
import { PythonClient } from '../../services/pythonClient';

const router = Router();

// Endpoint for climate risk prediction
// Fetches data from upstream layers and uses Gemini for reasoning via Python service
router.get('/fields/:fieldId/climate-risk', async (req: Request, res: Response) => {
  try {
    const { fieldId } = req.params;

    // In a real implementation, this would fetch real data. 
    // Passing mock context to the real Python AI engine for now.
    const riskPrediction = await PythonClient.assessClimateRisk({
      region: 'Punjab',
      weather_history: 'Dry and hot for the last 14 days, average max temp 38C.',
      weather_forecast: 'Temperatures rising to 42C next week with no rain.',
      crop_type: 'Wheat'
    });

    // Map Python response to frontend expected format
    res.json({
      fieldId,
      riskType: riskPrediction.primary_risks[0] || 'Unknown Risk',
      severity: riskPrediction.risk_level,
      timeframe: 'In 3 days', // Could be inferred by AI
      protectiveAction: riskPrediction.mitigation_strategies.join(' '),
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Climate Risk Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
