import { Router, Request, Response } from 'express';
import { layer7Service } from '../disease/disease.service';

const router = Router();

// POST /api/fields/:fieldId/diagnose
router.post('/:fieldId/diagnose', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    
    // In a real app, we'd use multer and parse the file. 
    // Here we just mock the blob size from the body to simulate different test cases.
    const { imageBlobSize } = req.body;

    const result = await layer7Service.diagnoseCrop(fieldId, imageBlobSize || 1024);
    res.json(result);
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fields/:fieldId/diagnoses
router.get('/:fieldId/diagnoses', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    const history = await layer7Service.getDiagnosisHistory(fieldId);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
