import { Router } from "express";
import { CrossBorderService } from "./cross-border.service.js";

const router = Router();

// Get aggregated global insights for a specific field's context
router.get("/fields/:fieldId/global-insights", async (req, res) => {
  try {
    res.json({
      fieldId: req.params.fieldId,
      insights: [
        { title: "Global Yield Trend", description: "Wheat yields are up 5% globally this season.", relevance: "High" },
        { title: "Pest Migration", description: "Desert locusts sighted in neighboring region.", relevance: "Medium" }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cross-border insights" });
  }
});

export default router;
