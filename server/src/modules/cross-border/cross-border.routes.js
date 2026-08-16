import { Router } from "express";
import { CrossBorderService } from "./cross-border.service.js";

const router = Router();

// Get aggregated global insights for a specific field's context
router.get("/fields/:fieldId/global-insights", async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const insights = await CrossBorderService.getGlobalInsights(fieldId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cross-border insights" });
  }
});

export default router;
