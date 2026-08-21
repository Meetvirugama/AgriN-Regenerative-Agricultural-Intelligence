import { escalationRepo } from "../../db/repositories/escalationRepository.js";
import { query } from "../../db/connection.js";

export class EscalationService {
  /**
   * Create a new escalation ticket in PostgreSQL.
   * farmerId must be the authenticated farmer's UUID from req.farmer.sub.
   */
  static async triggerEscalation(farmerId, fieldId, reason, source, contextData = {}) {
    const row = await escalationRepo.createTicket({
      field_id: fieldId,
      farmer_id: farmerId,
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

    // Real average health score aggregated from field_health_scores
    let averageHealthScore = null;
    try {
      const healthRow = await query(
        `SELECT ROUND(AVG(overall_score))::int AS avg_score
         FROM field_health_scores
         WHERE computed_at > NOW() - INTERVAL '7 days'`,
        [],
      );
      averageHealthScore = healthRow[0]?.avg_score ?? null;
    } catch {
      // table may not exist yet — degrade gracefully
    }

    // Real top issues from field_observations in the last 30 days
    let topIssues = [];
    try {
      const issueRows = await query(
        `SELECT condition_name AS issue, COUNT(*) AS cnt
         FROM field_observations
         WHERE submitted_at > NOW() - INTERVAL '30 days'
           AND condition_name IS NOT NULL
         GROUP BY condition_name
         ORDER BY cnt DESC
         LIMIT 5`,
        [],
      );
      topIssues = issueRows.map((r) => r.issue);
    } catch {
      // table may not exist yet — degrade gracefully
    }

    return {
      region: "Punjab",
      activeTickets: stats.activeTickets,
      highSeverityCount: stats.highSeverityCount,
      averageHealthScore,
      climateRiskLevel: stats.highSeverityCount > 2 ? "high" : "medium",
      topIssues: topIssues.length > 0 ? topIssues : ["No data"],
    };
  }
}
