import { Router, Request, Response } from 'express';
import { layer4Service } from '../services/Layer4Service';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/fields/:fieldId/soil
router.get('/:fieldId/soil', (req: Request, res: Response) => {
  try {
    const profile = layer4Service.getActiveSoilProfile(req.params.fieldId as string);
    if (!profile) {
      return res.status(404).json({ error: 'No soil data available.' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fields/:fieldId/soil/parse
router.post('/:fieldId/soil/parse', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document required' });
    }
    
    const parsedData = await layer4Service.parseLabReport(req.params.fieldId as string, req.file.buffer);
    res.json(parsedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fields/:fieldId/soil/save
router.post('/:fieldId/soil/save', (req: Request, res: Response) => {
  try {
    const profile = layer4Service.saveSoilProfile(req.params.fieldId as string, req.body);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
