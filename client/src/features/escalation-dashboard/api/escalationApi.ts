export interface EscalationTicket {
  id: string;
  fieldId: string;
  farmerId: string;
  reason: 'low_confidence' | 'high_severity';
  source: 'Layer07' | 'Layer09';
  status: 'pending' | 'resolved';
  createdAt: string;
  contextData: any;
}

export interface RegionalRisk {
  region: string;
  activeTickets: number;
  highSeverityCount: number;
  averageHealthScore: number;
  climateRiskLevel: 'low' | 'moderate' | 'high';
  topIssues: string[];
}

export const escalationApi = {
  triggerEscalation: async (
    fieldId: string, 
    reason: 'low_confidence' | 'high_severity', 
    source: 'Layer07' | 'Layer09', 
    contextData: any
  ): Promise<EscalationTicket> => {
    const res = await fetch('http://localhost:8000/api/escalations/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldId, reason, source, contextData })
    });
    if (!res.ok) throw new Error('Failed to trigger escalation');
    return res.json();
  },

  getPendingTickets: async (): Promise<EscalationTicket[]> => {
    const res = await fetch('http://localhost:8000/api/escalations/tickets');
    if (!res.ok) throw new Error('Failed to fetch tickets');
    const data = await res.json();
    return data.tickets;
  },

  resolveTicket: async (ticketId: string): Promise<EscalationTicket> => {
    const res = await fetch(`http://localhost:8000/api/escalations/tickets/${ticketId}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to resolve ticket');
    return res.json();
  },

  getRegionalRisk: async (): Promise<RegionalRisk> => {
    const res = await fetch('http://localhost:8000/api/escalations/regional-risk');
    if (!res.ok) throw new Error('Failed to fetch regional risk');
    return res.json();
  }
};
