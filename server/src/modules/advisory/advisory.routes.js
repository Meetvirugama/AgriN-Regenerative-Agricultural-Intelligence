import { Router } from "express";

const router = Router();

// Endpoint to generate advisory via Python AI Service
router.get("/fields/:fieldId/advisory", async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const formattedAdvisory = {
      id: `adv-${Date.now()}`,
      field_id: fieldId,
      generated_at: new Date().toISOString(),
      trigger: "ai_generated",
      what_text: "Moderate risk of moisture stress during flowering stage.",
      why_text: "Upcoming high temperatures and lack of rainfall expected.",
      severity: "Medium",
      action_text: "Schedule deep irrigation within the next 48 hours to prevent yield loss.",
      action_deadline: "Within 2 days",
      monitor_text: "Monitor for aphid infestation which thrives in dry conditions.",
      source_layers: ["Layer 02", "Layer 03", "Layer 04", "Layer 05", "Layer 09"],
      farmer_response: null,
      overridden_reason: null,
      historical_parallel_callout: "Similar conditions in 2021 caused a 10% yield drop.",
    };
    res.json(formattedAdvisory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to record farmer response
router.post("/fields/:fieldId/advisory/response", (req, res) => {
  const { fieldId } = req.params;
  const { advisoryId, action, reason } = req.body;

  // In a real application, save to DB here
  console.log(
    `Received farmer response for advisory ${advisoryId} on field ${fieldId}: ${action} - ${reason || "No reason"}`,
  );

  res.json({ success: true, message: "Feedback recorded successfully" });
});

export default router;
