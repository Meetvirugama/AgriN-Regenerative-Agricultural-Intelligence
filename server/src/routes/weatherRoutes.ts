import { Router, Request, Response } from 'express';
import { layer3Service } from '../services/Layer3Service';

const router = Router();

// GET /api/fields/:fieldId/weather/forecast
router.get('/:fieldId/weather/forecast', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    
    // In a real system, we'd serve cached forecasts and a background job would fetch.
    // For MVP, if it doesn't exist, we fetch it immediately (on-demand cache).
    let data = layer3Service.getLocalizedForecast(fieldId);
    if (data.forecasts.length === 0) {
      data = await layer3Service.fetchAndStoreForecast(fieldId);
    }
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fields/:fieldId/weather/history
router.get('/:fieldId/weather/history', async (req: Request, res: Response) => {
  try {
    const history = await layer3Service.getFieldWeatherHistory(req.params.fieldId as string);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
