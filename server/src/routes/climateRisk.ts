import { Router, Request, Response } from 'express';

const router = Router();

// Mock data for climate risk prediction
// In a real implementation, this would fetch data from upstream layers and use Gemini for reasoning
router.get('/fields/:fieldId/climate-risk', (req: Request, res: Response) => {
  const { fieldId } = req.params;

  // Mocking the AI reasoning output based on the Layer 08 requirements
  const mockRiskPrediction = {
    fieldId,
    riskType: 'Heatwave',
    severity: 'High',
    timeframe: 'In 3 days',
    protectiveAction: 'Irrigate heavily tonight before the flowering stage is impacted. Soil moisture is currently adequate, but elevated temperatures will accelerate evaporation.',
    generatedAt: new Date().toISOString(),
  };

  res.json(mockRiskPrediction);
});

export default router;
