import { request } from '../../../services/apiClient';

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
    return request('escalations/trigger', {
      method: 'POST',
      body: JSON.stringify({ fieldId, reason, source, contextData })
    });
  },

  getPendingTickets: async (): Promise<EscalationTicket[]> => {
    const data = await request<{tickets: EscalationTicket[]}>('escalations/tickets');
    return data.tickets;
  },

  resolveTicket: async (ticketId: string): Promise<EscalationTicket> => {
    return request(`escalations/tickets/${ticketId}/resolve`, {
      method: 'POST'
    });
  },

  getRegionalRisk: async (): Promise<RegionalRisk> => {
    return request('escalations/regional-risk');
  }
};
