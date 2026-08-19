import { Router } from "express";
import { CrossBorderService } from "./cross-border.service.js";

const router = Router();

// Get aggregated global insights for a specific field's context
router.get("/fields/:fieldId/global-insights", async (req, res) => {
  try {
    const { fieldId } = req.params;
    const insights = await CrossBorderService.getGlobalInsights(fieldId);
    res.json({ fieldId, insights });
  } catch (error) {
    console.error("[CrossBorder] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch cross-border insights" });
  }
});

export default router;

