import { Router, Request, Response } from 'express';
import { layer2Service } from '../crop/crop.service';
import { layer1Service } from '../field/field.service';

const router = Router();

// Minimal Layer 1 stub endpoints to get a field to work with
router.post('/stub-init', (req: Request, res: Response) => {
  const farmer = layer1Service.getOrCreateMockFarmer();
  // Register a field sown 45 days ago
  const date45DaysAgo = new Date();
  date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);
  
  const field = layer1Service.registerField(
    farmer.id, 
    'Main Plot', 
    'wheat', 
    date45DaysAgo.toISOString()
  );
  
  res.json({ farmer, field });
});

// GET /api/fields/:fieldId/crop-state
router.get('/:fieldId/crop-state', (req: Request, res: Response) => {
  try {
    const state = layer2Service.getFieldCropState(req.params.fieldId as string);
    res.json(state);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// POST /api/fields/:fieldId/identify-crop
router.post('/:fieldId/identify-crop', (req: Request, res: Response) => {
  try {
    // In a real app we'd parse multipart/form-data for the image
    const result = layer2Service.identifyCrop(req.params.fieldId as string, req.body.image);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fields/:fieldId/override-stage
router.post('/:fieldId/override-stage', (req: Request, res: Response) => {
  try {
    const { cropType, variety, stage } = req.body;
    const newState = layer2Service.overrideCropState(req.params.fieldId as string, cropType, variety, stage);
    res.json(newState);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const cropRoutes = router;
