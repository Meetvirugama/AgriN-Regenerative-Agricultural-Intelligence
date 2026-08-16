import { query, queryOne } from "../connection.js";

export class DiagnosisRepository {
  async saveEvent(event) {
    const row = await queryOne(
      `INSERT INTO diagnosis_events
         (field_id, photo_url, crop_type, growth_stage,
          recent_weather_snapshot, field_health_context,
          predicted_category, predicted_label, confidence,
          severity, recommended_action_text, escalation_triggered)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, field_id, photo_url, submitted_at::text, crop_type,
                 growth_stage, recent_weather_snapshot, field_health_context,
                 predicted_category, predicted_label, confidence::float,
                 severity, recommended_action_text, escalation_triggered`,
      [
        event.field_id,
        event.photo_url,
        event.crop_type,
        event.growth_stage,
        JSON.stringify(event.recent_weather_snapshot ?? null),
        JSON.stringify(event.field_health_context ?? null),
        event.predicted_category,
        event.predicted_label,
        event.confidence,
        event.severity,
        event.recommended_action_text ?? null,
        event.escalation_triggered,
      ],
    );
    return row;
  }

  async getEventsByField(fieldId, limit = 20) {
    return query(
      `SELECT id, field_id, photo_url, submitted_at::text, crop_type,
              growth_stage, recent_weather_snapshot, field_health_context,
              predicted_category, predicted_label, confidence::float,
              severity, recommended_action_text, escalation_triggered
       FROM diagnosis_events
       WHERE field_id = $1
       ORDER BY submitted_at DESC
       LIMIT $2`,
      [fieldId, limit],
    );
  }
}

export const diagnosisRepo = new DiagnosisRepository();
