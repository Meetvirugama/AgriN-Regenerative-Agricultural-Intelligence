import { request } from "../../../services/apiClient";

export const escalationApi = {
  triggerEscalation: async (fieldId, reason, source, contextData) => {
    return request("escalations/trigger", {
      method: "POST",
      body: JSON.stringify({ fieldId, reason, source, contextData }),
    });
  },

  getPendingTickets: async () => {
    const data = await request("escalations/tickets");
    return data.tickets;
  },

  resolveTicket: async (ticketId) => {
    return request(`escalations/tickets/${ticketId}/resolve`, {
      method: "POST",
    });
  },

  getRegionalRisk: async () => {
    return request("escalations/regional-risk");
  },
};
