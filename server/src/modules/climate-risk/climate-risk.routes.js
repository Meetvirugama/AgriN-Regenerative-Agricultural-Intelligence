import { Router } from "express";
import { PythonClient } from "../../services/pythonClient.js";

const router = Router();

// Endpoint for climate risk prediction
router.get("/fields/:fieldId/climate-risk", async (req, res) => {
  try {
    const { fieldId } = req.params;
    res.json({
      fieldId,
      riskType: "Drought",
      severity: "High",
      timeframe: "In 3 days",
      protectiveAction: "Increase irrigation frequency and apply mulch.",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Climate Risk Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
