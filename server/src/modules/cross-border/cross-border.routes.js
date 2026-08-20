import { Router } from "express";
import { CrossBorderService } from "./cross-border.service.js";

const router = Router();

// Get aggregated global insights for a specific field's context
router.get("/fields/:fieldId/global-insights", async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const insights = await CrossBorderService.getGlobalInsights(fieldId);
    res.json({ fieldId, insights });
  } catch (error) {
    console.error("[CrossBorder] Error:", error.message);
    next(error);
  }
});

export default router;
