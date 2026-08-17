import { Router } from "express";
import { layer10Service } from "../regen/regen.service.js";

const router = Router();

// GET /api/fields/:fieldId/regen/planning
router.get("/:fieldId/regen/planning", async (req, res) => {
  try {
    res.json({
      fieldId: req.params.fieldId,
      plan_status: "Active",
      carbon_credits_est: 12.5,
      next_milestone: "Cover Crop Planting",
      milestone_date: "2025-08-15",
      practices: [
        { name: "No-Till Farming", status: "Implemented" },
        { name: "Cover Cropping", status: "Planned" }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
