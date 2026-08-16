import { Router } from "express";
import { layer7Service } from "../disease/disease.service.js";

const router = Router();

// POST /api/fields/:fieldId/diagnose
router.post("/:fieldId/diagnose", async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const {
      image,
      crop_type = "wheat",
      crop_stage = "vegetative",
      recent_weather = "normal",
    } = req.body;
    if (!image) throw new Error("Image data is required");

    // Convert base64 data URL to Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Call Python AI service
    const { PythonClient } = await import("../../services/pythonClient");
    const result = await PythonClient.diagnoseDisease(
      imageBuffer,
      mimeType,
      crop_type,
      crop_stage,
      recent_weather,
    );
    res.json(result);
  } catch (error) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fields/:fieldId/diagnoses
router.get("/:fieldId/diagnoses", async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const history = await layer7Service.getDiagnosisHistory(fieldId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
