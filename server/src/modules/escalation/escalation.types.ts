export interface EscalationTicket {
  id: string;
  fieldId: string;
  farmerId: string;
  reason: 'low_confidence' | 'high_severity' | 'farmer_request';
  source: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  contextData: any;
}

export interface RegionalRisk {
  region: string;
  activeTickets: number;
  highSeverityCount: number;
  averageHealthScore: number;
  climateRiskLevel: 'low' | 'medium' | 'moderate' | 'high';
  topIssues: string[];
}

