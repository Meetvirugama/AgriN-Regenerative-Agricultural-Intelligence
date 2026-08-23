import { Router } from "express";
import { z } from "zod";
import { EscalationService } from "./escalation.service.js";
import { validate, validateUuidParam } from "../../middleware/validate.js";

const router = Router();

const TriggerEscalationSchema = z.object({
  fieldId: z.string().uuid("Invalid field ID format"),
  reason: z.string().min(1, "Reason is required").max(500),
  source: z.string().min(1, "Source is required").max(100),
  contextData: z.any().optional(),
});

// Trigger a new escalation (Farmer Side)
router.post("/trigger", validate({ body: TriggerEscalationSchema }), async (req, res, next) => {
  try {
    const { fieldId, reason, source, contextData } = req.body;
    const farmerId = req.farmer?.sub ?? null;
    const ticket = await EscalationService.triggerEscalation(
      farmerId,
      fieldId,
      reason,
      source,
      contextData,
    );
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// Get pending tickets (Extension Worker Side)
router.get("/tickets", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;
    const pending = await EscalationService.getPendingTickets(limit, offset);
    res.json({ tickets: pending, page, limit });
  } catch (err) {
    next(err);
  }
});

// Resolve a ticket
router.post("/tickets/:id/resolve", validateUuidParam("id"), async (req, res, next) => {
  try {
    await EscalationService.resolveTicket(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get regional heatmap/risk data
router.get("/regional-risk", async (_req, res, next) => {
  try {
    const risk = await EscalationService.getRegionalRisk();
    res.json(risk);
  } catch (err) {
    next(err);
  }
});

export default router;
