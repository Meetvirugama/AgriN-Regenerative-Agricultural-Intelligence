import { Router } from "express";
import { layer10Service } from "../regen/regen.service.js";

const router = Router();

// GET /api/fields/:fieldId/regen/planning
router.get("/:fieldId/regen/planning", async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const plan = await layer10Service.getRegenPlan(fieldId);
    res.json(plan);
  } catch (error) {
    console.error("Regen Planning error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
