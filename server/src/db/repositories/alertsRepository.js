import { query, queryOne, execute } from "../connection.js";

export class AlertsRepository {
  async findAlertsByFarmerId(farmerId) {
    const rows = await query(
      `SELECT 
         a.id, 
         a.title, 
         a.description, 
         a.priority, 
         a.type, 
         a.resolved, 
         a.created_at,
         COALESCE(f.name, 'All Fields') as field
       FROM alerts a
       LEFT JOIN fields f ON a.field_id = f.id
       WHERE a.farmer_id = $1
       ORDER BY a.created_at DESC`,
      [farmerId]
    );
    return rows;
  }

  async createAlert(farmerId, alertData) {
    const row = await queryOne(
      `INSERT INTO alerts (farmer_id, field_id, title, description, priority, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        farmerId,
        alertData.field_id || null,
        alertData.title,
        alertData.description,
        alertData.priority,
        alertData.type
      ]
    );
    return row;
  }
}

export const alertsRepository = new AlertsRepository();
