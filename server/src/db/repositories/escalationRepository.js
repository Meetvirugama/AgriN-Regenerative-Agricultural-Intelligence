import { query, queryOne, execute } from "../connection.js";

export class EscalationRepository {
  async createTicket(ticket) {
    const row = await queryOne(
      `INSERT INTO escalation_tickets
         (field_id, farmer_id, source, reason, context_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, field_id, farmer_id, source, reason, context_data,
                 status, created_at::text, resolved_at::text`,
      [
        ticket.field_id,
        ticket.farmer_id,
        ticket.source,
        ticket.reason,
        JSON.stringify(ticket.context_data ?? {}),
      ],
    );
    return row;
  }

  async getPendingTickets(limit = 20, offset = 0) {
    return query(
      `SELECT id, field_id, farmer_id, source, reason, context_data,
              status, created_at::text, resolved_at::text
       FROM escalation_tickets
       WHERE status = 'pending'
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async resolveTicket(id) {
    await execute(
      `UPDATE escalation_tickets
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1`,
      [id],
    );
  }

  async getRegionalStats() {
    const row = await queryOne(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') AS active_tickets,
         COUNT(*) FILTER (WHERE status = 'pending' AND reason = 'high_severity') AS high_severity_count
       FROM escalation_tickets
       WHERE created_at > NOW() - INTERVAL '30 days'`,
      [],
    );
    return {
      activeTickets: parseInt(row?.active_tickets ?? "0", 10),
      highSeverityCount: parseInt(row?.high_severity_count ?? "0", 10),
    };
  }
}

export const escalationRepo = new EscalationRepository();
