import { query, queryOne, execute } from '../connection';

export interface FeedbackRecord {
  id: string;
  advisory_id: string | null;
  field_id: string;
  prompted_at: string;
  farmer_response: 'helped' | 'didnt_help' | 'no_response' | null;
  follow_up_photo_url: string | null;
  follow_up_note: string | null;
  collected_at: string | null;
}

export interface TimelineEntry {
  id: string;
  field_id: string;
  entry_date: string;
  entry_type: 'advisory' | 'diagnosis' | 'weather_event' | 'farmer_note' | 'satellite_anomaly';
  summary_text: string;
  linked_record_id: string | null;
  season_label: string | null;
}

export class FeedbackRepository {
  async saveFeedback(
    feedback: Omit<FeedbackRecord, 'id' | 'prompted_at'>
  ): Promise<FeedbackRecord> {
    const row = await queryOne<FeedbackRecord>(
      `INSERT INTO feedback_events
         (advisory_id, field_id, farmer_response, follow_up_photo_url, follow_up_note, collected_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, advisory_id::text, field_id::text, prompted_at::text,
                 farmer_response, follow_up_photo_url, follow_up_note, collected_at::text`,
      [
        feedback.advisory_id ?? null, feedback.field_id,
        feedback.farmer_response, feedback.follow_up_photo_url ?? null,
        feedback.follow_up_note ?? null,
      ]
    );
    return row!;
  }

  async getPendingPrompts(fieldId: string): Promise<FeedbackRecord[]> {
    return query<FeedbackRecord>(
      `SELECT id, advisory_id::text, field_id::text, prompted_at::text,
              farmer_response, follow_up_photo_url, follow_up_note, collected_at::text
       FROM feedback_events
       WHERE field_id = $1 AND farmer_response IS NULL
       ORDER BY prompted_at DESC`,
      [fieldId]
    );
  }
}

export class TimelineRepository {
  async addEntry(entry: Omit<TimelineEntry, 'id'>): Promise<TimelineEntry> {
    const row = await queryOne<TimelineEntry>(
      `INSERT INTO field_timeline_entries
         (field_id, entry_date, entry_type, summary_text, linked_record_id, season_label)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id::text, field_id::text, entry_date::text, entry_type,
                 summary_text, linked_record_id::text, season_label`,
      [
        entry.field_id, entry.entry_date ?? new Date().toISOString(),
        entry.entry_type, entry.summary_text,
        entry.linked_record_id ?? null, entry.season_label ?? null,
      ]
    );
    return row!;
  }

  async getTimeline(fieldId: string, limit = 50): Promise<TimelineEntry[]> {
    return query<TimelineEntry>(
      `SELECT id::text, field_id::text, entry_date::text, entry_type,
              summary_text, linked_record_id::text, season_label
       FROM field_timeline_entries
       WHERE field_id = $1
       ORDER BY entry_date DESC
       LIMIT $2`,
      [fieldId, limit]
    );
  }
}

export const feedbackRepo = new FeedbackRepository();
export const timelineRepo = new TimelineRepository();
