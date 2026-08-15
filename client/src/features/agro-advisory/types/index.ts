export interface Advisory {
  id: string;
  field_id: string;
  generated_at: string;
  trigger: 'scheduled' | 'farmer_query' | 'event_flag';
  what_text: string;
  why_text: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  action_text: string;
  action_deadline: string;
  monitor_text: string;
  source_layers: string[];
  farmer_response: 'followed' | 'ignored' | 'overridden' | null;
  overridden_reason: string | null;
  historical_parallel_callout?: string;
}

export interface FarmerFeedbackPayload {
  action: 'followed' | 'ignored' | 'overridden';
  reason?: string;
}
