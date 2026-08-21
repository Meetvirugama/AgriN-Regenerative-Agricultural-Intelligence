import { query, queryOne } from "../connection.js";

export class FeedbackRepository {
  async saveFeedback(feedback) {
    const row = await queryOne(
      `INSERT INTO feedback_events
         (advisory_id, field_id, farmer_response, follow_up_photo_url, follow_up_note, collected_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, advisory_id::text, field_id::text, prompted_at::text,
                 farmer_response, follow_up_photo_url, follow_up_note, collected_at::text`,
      [
        feedback.advisory_id ?? null,
        feedback.field_id,
        feedback.farmer_response,
        feedback.follow_up_photo_url ?? null,
        feedback.follow_up_note ?? null,
      ],
    );
    return row;
  }

  async getPendingPrompts(fieldId) {
    return query(
      `SELECT f.id, f.advisory_id::text, f.field_id::text, f.prompted_at::text,
              f.farmer_response, f.follow_up_photo_url, f.follow_up_note, f.collected_at::text,
              a.action_text AS summary
       FROM feedback_events f
       LEFT JOIN advisory_records a ON f.advisory_id = a.id
       WHERE f.field_id = $1 AND f.farmer_response IS NULL
       ORDER BY f.prompted_at DESC`,
      [fieldId],
    );
  }
}

export class TimelineRepository {
  async addEntry(entry) {
    const row = await queryOne(
      `INSERT INTO field_timeline_entries
         (field_id, entry_date, entry_type, summary_text, linked_record_id, season_label)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id::text, field_id::text, entry_date::text, entry_type,
                 summary_text, linked_record_id::text, season_label`,
      [
        entry.field_id,
        entry.entry_date ?? new Date().toISOString(),
        entry.entry_type,
        entry.summary_text,
        entry.linked_record_id ?? null,
        entry.season_label ?? null,
      ],
    );
    return row;
  }

  async getTimeline(fieldId, limit = 50) {
    return query(
      `SELECT id::text, field_id::text, entry_date::text, entry_type,
              summary_text, linked_record_id::text, season_label
       FROM field_timeline_entries
       WHERE field_id = $1
       ORDER BY entry_date DESC
       LIMIT $2`,
      [fieldId, limit],
    );
  }
}

export const feedbackRepo = new FeedbackRepository();
export const timelineRepo = new TimelineRepository();
