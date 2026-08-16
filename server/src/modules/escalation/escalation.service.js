import { escalationRepo } from "../../db/repositories/escalationRepository.js";
import { STUB_FARMER_ID } from "../field/field.service.js";

export class EscalationService {
  /**
   * Create a new escalation ticket in PostgreSQL.
   * Previously this used a hardcoded in-memory array with a fake farmerId.
   */
  static async triggerEscalation(fieldId, reason, source, contextData = {}) {
    const row = await escalationRepo.createTicket({
      field_id: fieldId,
      farmer_id: STUB_FARMER_ID, // Phase 4: replace with JWT-authenticated farmer ID
      source,
      reason,
      context_data: contextData,
    });

    // Map DB shape → client shape
    return {
      id: row.id,
      fieldId: row.field_id,
      farmerId: row.farmer_id,
      reason: row.reason,
      source: row.source,
      status: row.status,
      createdAt: row.created_at,
      contextData: row.context_data,
    };
  }

  static async getPendingTickets(limit = 20, offset = 0) {
    const rows = await escalationRepo.getPendingTickets(limit, offset);
    return rows.map((r) => ({
      id: r.id,
      fieldId: r.field_id,
      farmerId: r.farmer_id,
      reason: r.reason,
      source: r.source,
      status: r.status,
      createdAt: r.created_at,
      contextData: r.context_data,
    }));
  }

  static async resolveTicket(ticketId) {
    await escalationRepo.resolveTicket(ticketId);
  }

  static async getRegionalRisk() {
    const stats = await escalationRepo.getRegionalStats();
    return {
      region: "Punjab",
      activeTickets: stats.activeTickets,
      highSeverityCount: stats.highSeverityCount,
      averageHealthScore: 68, // Phase 6: compute from real health-score aggregation
      climateRiskLevel: stats.highSeverityCount > 2 ? "high" : "medium",
      topIssues: ["Late Blight", "Drought Stress", "Nutrient Deficiency"], // Phase 6: AI-aggregated
    };
  }
}
