export interface EscalationTicket {
  id: string;
  fieldId: string;
  farmerId: string;
  reason: 'low_confidence' | 'high_severity';
  source: 'Layer07' | 'Layer09';
  status: 'pending' | 'resolved';
  createdAt: string;
  contextData: any; // E.g., photo blob ref, crop stage, health score
}

export interface RegionalRisk {
  region: string;
  activeTickets: number;
  highSeverityCount: number;
  averageHealthScore: number;
  climateRiskLevel: 'low' | 'moderate' | 'high';
  topIssues: string[];
}
