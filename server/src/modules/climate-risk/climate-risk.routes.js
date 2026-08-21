import { Router } from "express";
import { PythonClient } from "../../services/pythonClient.js";
import { layer1Service } from "../field/field.service.js";

const router = Router();

// Endpoint for climate risk prediction — delegates to Python AI service
router.get("/fields/:fieldId/climate-risk", async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const field = await layer1Service.getField(fieldId);
    if (!field) {
      return res.status(404).json({ error: { message: "Field not found" } });
    }
    const result = await PythonClient.assessClimateRisk({
      field_id: fieldId,
      crop_type: field.crop_type,
      lat: field.lat,
      lng: field.lng,
      sowing_date: field.sowing_date,
    });

    // ─── Normalize AI-service contract → frontend contract ─────────────────
    // The Python service returns { risk_level, primary_risks, mitigation_strategies }.
    // ClimateRiskWidget.jsx expects { severity, riskType, timeframe, protectiveAction, generatedAt }.
    // Previously this raw snake_case payload was returned as-is, so `data.severity`
    // was undefined on the client and mapSeverityToStatus(undefined) threw
    // "Cannot read properties of undefined (reading 'toLowerCase')".
    const primaryRisks = Array.isArray(result.primary_risks) ? result.primary_risks : [];
    const mitigations = Array.isArray(result.mitigation_strategies) ? result.mitigation_strategies : [];

    res.json({
      severity: result.risk_level ?? "unknown",
      riskType: primaryRisks[0] ?? "Climate Risk",
      allRisks: primaryRisks,
      timeframe: "Next 7 days",
      protectiveAction:
        mitigations.length > 0
          ? mitigations.join(" ")
          : "No specific mitigation guidance available yet.",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ClimateRisk] Error:", error.message);
    next(error);
  }
});

export default router;
