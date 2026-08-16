import React, { useEffect, useState } from "react";
import { escalationApi } from "../api/escalationApi";
import {
  Map,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

export function ExtensionDashboard() {
  const [tickets, setTickets] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds to simulate real-time queue
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [t, r] = await Promise.all([
        escalationApi.getPendingTickets(),
        escalationApi.getRegionalRisk(),
      ]);
      setTickets(t);
      setRisk(r);
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await escalationApi.resolveTicket(id);
      fetchData();
    } catch (e) {
      console.error("Failed to resolve ticket", e);
    }
  };

  if (loading && !risk) {
    return (
      <div className="p-8 text-center text-text-muted">
        Loading Extension Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-6 mt-8">
        <header className="mb-2">
          <div className="flex items-center gap-3 text-secondary mb-2">
            <ShieldAlert size={28} />
            <h1 className="text-3xl font-black text-text tracking-tight">
              Extension Hub
            </h1>
          </div>
          <p className="text-text-muted font-medium">
            Layer 13 — Human Escalation & Regional Aggregation
          </p>
        </header>

        {/* Regional Risk Aggregation */}
        {risk && (
          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-bold text-lg text-text uppercase tracking-wide flex items-center gap-2">
                  <Map size={20} className="text-primary" />
                  {risk.region} Region
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Aggregated Field Data
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Climate Risk
                </span>
                <div
                  className={`text-lg font-black uppercase mt-1 ${risk.climateRiskLevel === "high" ? "text-error" : "text-warning"}`}
                >
                  {risk.climateRiskLevel}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface rounded-xl p-4 shadow-sm border border-neutral">
                <div className="text-sm text-text-muted font-bold mb-1">
                  Active Alerts
                </div>
                <div className="text-2xl font-black text-text">
                  {risk.activeTickets}
                </div>
              </div>
              <div className="bg-surface rounded-xl p-4 shadow-sm border border-neutral">
                <div className="text-sm text-text-muted font-bold mb-1">
                  High Severity
                </div>
                <div className="text-2xl font-black text-error">
                  {risk.highSeverityCount}
                </div>
              </div>
              <div className="bg-surface rounded-xl p-4 shadow-sm border border-neutral">
                <div className="text-sm text-text-muted font-bold mb-1">
                  Avg Health
                </div>
                <div className="text-2xl font-black text-primary">
                  {risk.averageHealthScore}/100
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">
                Top Emerging Issues
              </div>
              <div className="flex flex-wrap gap-2">
                {risk.topIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="bg-surface border border-neutral px-3 py-1 rounded-full text-sm font-bold text-text"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Escalation Queue */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-text">Triage Queue</h2>
            <span className="bg-error text-error-content px-3 py-1 rounded-full text-xs font-bold uppercase">
              {tickets.length} Pending
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {tickets.length === 0 ? (
              <div className="bg-surface border border-neutral rounded-xl p-8 text-center text-text-muted">
                <CheckCircle className="mx-auto mb-3 opacity-50" size={32} />
                <p className="font-bold">Queue is clear.</p>
                <p className="text-sm mt-1">
                  All escalations have been handled.
                </p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-surface border border-neutral rounded-xl overflow-hidden shadow-sm flex flex-col"
                >
                  <div
                    className={`px-4 py-2 flex justify-between items-center ${ticket.reason === "high_severity" ? "bg-error/10 border-b border-error/20" : "bg-warning/10 border-b border-warning/20"}`}
                  >
                    <div className="flex items-center gap-2">
                      {ticket.reason === "high_severity" ? (
                        <AlertTriangle size={16} className="text-error" />
                      ) : (
                        <HelpCircle size={16} className="text-warning" />
                      )}
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${ticket.reason === "high_severity" ? "text-error" : "text-warning"}`}
                      >
                        {ticket.reason === "high_severity"
                          ? "High Severity Alert"
                          : "Low Confidence (AI Uncertainty)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock size={12} />
                      {new Date(ticket.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-text">
                            Farmer: {ticket.farmerId}
                          </h3>
                          {ticket.contextData?.consentVerified && (
                            <span className="bg-success/20 text-success px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle size={10} /> Consent Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted">
                          Field:{" "}
                          <span className="font-mono">{ticket.fieldId}</span>
                          <span className="mx-2">•</span>
                          Source:{" "}
                          <span className="font-bold">
                            {ticket.source === "Layer07"
                              ? "Disease Diagnosis"
                              : "AI Agro-Advisory"}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleResolve(ticket.id)}
                        className="bg-secondary text-secondary-content px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
                      >
                        Acknowledge & Resolve
                      </button>
                    </div>

                    <div className="bg-neutral/20 rounded-lg p-3 text-sm text-text font-medium border border-neutral font-mono">
                      <span className="text-text-muted text-xs uppercase tracking-wide mb-1 block">
                        Context Data payload:
                      </span>
                      {JSON.stringify(ticket.contextData, null, 2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
