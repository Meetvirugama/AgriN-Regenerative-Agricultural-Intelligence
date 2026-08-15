export interface FeedbackEvent {
  id: string;
  advisory_id: string;
  field_id: string;
  prompted_at: string;
  farmer_response: 'helped' | 'didnt_help' | 'no_response';
  follow_up_photo_url: string | null;
  follow_up_note: string | null;
  collected_at: string | null;
}

export interface FieldTimelineEntry {
  id: string;
  field_id: string;
  date: string;
  entry_type: 'advisory' | 'diagnosis' | 'weather_event' | 'farmer_note' | 'satellite_anomaly';
  summary_text: string;
  linked_record_id: string;
  season_label: string;
}

export interface PendingPrompt {
  id: string;
  advisory_id: string;
  field_id: string;
  prompted_at: string;
  summary: string;
}
