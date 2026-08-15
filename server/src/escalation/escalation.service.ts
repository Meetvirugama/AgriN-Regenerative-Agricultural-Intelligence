import { EscalationTicket, RegionalRisk } from './escalation.types';

// In-memory store for MVP
const tickets: EscalationTicket[] = [
  // Stub an existing ticket for the dashboard to look populated
  {
    id: 'ticket-999',
    fieldId: 'mock-field-456',
    farmerId: 'farmer-789',
    reason: 'high_severity',
    source: 'Layer07',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    contextData: { issue: 'Late Blight', confidence: 0.95 }
  }
];

export class EscalationService {
  static triggerEscalation(
    fieldId: string, 
    reason: 'low_confidence' | 'high_severity', 
    source: 'Layer07' | 'Layer09', 
    contextData: any = {}
  ): EscalationTicket {
    const ticket: EscalationTicket = {
      id: `ticket-${Math.floor(Math.random() * 10000)}`,
      fieldId,
      farmerId: 'farmer-123', // Stub farmer ID
      reason,
      source,
      status: 'pending',
      createdAt: new Date().toISOString(),
      contextData
    };
    
    tickets.unshift(ticket);
    return ticket;
  }

  static getPendingTickets(): EscalationTicket[] {
    return tickets.filter(t => t.status === 'pending').sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  static resolveTicket(ticketId: string): EscalationTicket | null {
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) return null;
    
    tickets[index].status = 'resolved';
    return tickets[index];
  }

  static getRegionalRisk(): RegionalRisk {
    // Stub aggregated dashboard data
    const active = tickets.filter(t => t.status === 'pending');
    const highSev = active.filter(t => t.reason === 'high_severity');

    return {
      region: 'Central Rift Valley',
      activeTickets: active.length,
      highSeverityCount: highSev.length,
      averageHealthScore: 68,
      climateRiskLevel: 'high',
      topIssues: ['Late Blight', 'Drought Stress', 'Unknown Leaf Spot']
    };
  }
}
