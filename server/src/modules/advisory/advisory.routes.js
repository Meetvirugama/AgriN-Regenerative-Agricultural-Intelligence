import { Router } from "express";
import { advisoryService } from "./advisory.service.js";
import { execute } from "../../db/connection.js";

const router = Router();

/**
 * Generate a real Gemini advisory for a field.
 *
 * Pipeline: Field → Weather (Open-Meteo) → Satellite → Soil (SoilGrids) → Gemini
 *
 * Every response includes `evidence_summary` that shows which data sources
 * were available. If satellite data is simulated, this is flagged explicitly.
 */
router.get("/fields/:fieldId/advisory", async (req, res) => {
  try {
    const { fieldId } = req.params;
    const advisory = await advisoryService.generateAdvisory(fieldId);
    res.json(advisory);
  } catch (err) {
    console.error("[Advisory] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Record farmer response to an advisory (followed / ignored / overridden).
 */
router.post("/fields/:fieldId/advisory/response", async (req, res) => {
  const { fieldId } = req.params;
  const { advisoryId, action, reason } = req.body;

  if (!advisoryId || !action) {
    return res.status(400).json({ error: "advisoryId and action are required" });
  }

  try {
    await execute(
      `INSERT INTO farmer_advisory_responses (advisory_id, field_id, action, reason)
       VALUES ($1, $2, $3, $4)`,
      [advisoryId, fieldId, action, reason ?? null],
    );
    res.json({ success: true, message: "Farmer response recorded." });
  } catch (err) {
    console.error("[Advisory Response] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
