import { Router, Request, Response, NextFunction } from 'express';
import { layer2Service } from '../crop/crop.service';
import { layer1Service } from '../field/field.service';

const router = Router();

/**
 * POST /api/fields/stub-init
 * Idempotent — returns (or creates) the canonical mock farmer + field.
 */
router.post('/stub-init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await layer1Service.getOrCreateMockFarmer();
    const field  = await layer1Service.getOrCreateStubField(farmer.id);
    res.json({ farmer, field });
  } catch (err) { next(err); }
});

// GET /api/fields/:fieldId/crop-state
router.get('/:fieldId/crop-state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await layer2Service.getFieldCropState(req.params.fieldId as string);
    res.json(state);
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: { message: err.message } });
    } else {
      next(err);
    }
  }
});

// POST /api/fields/:fieldId/identify-crop
router.post('/:fieldId/identify-crop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image } = req.body;
    if (!image) throw new Error("Image data is required");
    
    // Convert base64 data URL to Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Call Python AI service
    const { PythonClient } = await import('../../services/pythonClient');
    const result = await PythonClient.identifyCrop(imageBuffer, mimeType);
    
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/fields/:fieldId/override-stage
router.post('/:fieldId/override-stage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropType, variety, stage } = req.body;
    const newState = await layer2Service.overrideCropState(
      req.params.fieldId as string, cropType, variety, stage
    );
    res.json(newState);
  } catch (err) { next(err); }
});

export const cropRoutes = router;

