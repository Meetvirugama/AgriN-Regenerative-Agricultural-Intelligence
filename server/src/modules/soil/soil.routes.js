import { Router } from "express";
import { layer4Service } from "../soil/soil.service.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/fields/:fieldId/soil
router.get("/:fieldId/soil", (req, res) => {
  try {
    const profile = layer4Service.getActiveSoilProfile(req.params.fieldId);
    if (!profile) {
      return res.status(404).json({ error: "No soil data available." });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fields/:fieldId/soil/parse
router.post(
  "/:fieldId/soil/parse",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Document required" });
      }
      const parsedData = await layer4Service.parseLabReport(
        req.params.fieldId,
        req.file.buffer,
      );
      res.json(parsedData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// POST /api/fields/:fieldId/soil/save
router.post("/:fieldId/soil/save", (req, res) => {
  try {
    const profile = layer4Service.saveSoilProfile(req.params.fieldId, req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
