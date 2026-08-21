import React, { useEffect, useState, useRef } from "react";
import { escalationApi } from "../api/escalationApi";
import {
  Map,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import "./ExtensionDashboard.css";

export function ExtensionDashboard() {
  const [tickets, setTickets] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Poll every 5 seconds to simulate real-time queue
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [t, r] = await Promise.all([
        escalationApi.getPendingTickets(),
        escalationApi.getRegionalRisk(),
      ]);

      if (isMounted.current) {
        setTickets(t);
        setRisk(r);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleResolve = async (id) => {
    try {
      await escalationApi.resolveTicket(id);
      fetchData(); // Trigger immediate refresh
    } catch (e) {
      console.error("Failed to resolve ticket", e);
    }
  };

  if (loading && !risk) {
    return (
      <div className="ext-dashboard">
        <div className="ext-container ext-loading">
          Loading Extension Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="ext-dashboard">
      <div className="ext-container">
        <header style={{ marginBottom: "0.5rem" }}>
          <div className="ext-header-row">
            <ShieldAlert size={28} />
            <h1 className="ext-header-title">Extension Hub</h1>
          </div>
          <p className="ext-header-subtitle">
            Layer 13 — Human Escalation &amp; Regional Aggregation
          </p>
        </header>

        {/* Regional Risk Aggregation */}
        {risk && (
          <section className="ext-risk-section">
            <div className="ext-risk-header">
              <div>
                <h2 className="ext-risk-region-title">
                  <Map size={20} className="ext-risk-region-icon" />
                  {risk.region} Region
                </h2>
                <p className="ext-risk-subtitle">Aggregated Field Data</p>
              </div>
              <div>
                <div className="ext-climate-label">Climate Risk</div>
                <div
                  className={`ext-climate-level ${
                    risk.climateRiskLevel === "high"
                      ? "ext-climate-high"
                      : "ext-climate-medium"
                  }`}
                >
                  {risk.climateRiskLevel}
                </div>
              </div>
            </div>

            <div className="ext-stats-grid">
              <div className="ext-stat-card">
                <div className="ext-stat-label">Active Alerts</div>
                <div className="ext-stat-value ext-stat-value-default">
                  {risk.activeTickets}
                </div>
              </div>
              <div className="ext-stat-card">
                <div className="ext-stat-label">High Severity</div>
                <div className="ext-stat-value ext-stat-value-error">
                  {risk.highSeverityCount}
                </div>
              </div>
              <div className="ext-stat-card">
                <div className="ext-stat-label">Avg Health</div>
                <div className="ext-stat-value ext-stat-value-primary">
                  {risk.averageHealthScore ?? "?"}/100
                </div>
              </div>
            </div>

            <div>
              <div className="ext-issues-label">Top Emerging Issues</div>
              <div className="ext-issues-list">
                {risk.topIssues.map((issue, idx) => (
                  <span key={idx} className="ext-issue-badge">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Escalation Queue */}
        <section>
          <div className="ext-queue-header">
            <h2 className="ext-queue-title">Triage Queue</h2>
            <span className="ext-queue-badge">
              {tickets.length} Pending
            </span>
          </div>

          <div className="ext-ticket-list">
            {tickets.length === 0 ? (
              <div className="ext-empty-queue">
                <CheckCircle size={32} className="ext-empty-icon" />
                <p className="ext-empty-title">Queue is clear.</p>
                <p className="ext-empty-subtitle">
                  All escalations have been handled.
                </p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const isHigh = ticket.reason === "high_severity";
                return (
                  <div key={ticket.id} className="ext-ticket">
                    <div
                      className={`ext-ticket-banner ${
                        isHigh
                          ? "ext-ticket-banner-high"
                          : "ext-ticket-banner-low"
                      }`}
                    >
                      <div className="ext-ticket-reason-box">
                        {isHigh ? (
                          <AlertTriangle
                            size={16}
                            className="ext-ticket-reason-icon-high"
                          />
                        ) : (
                          <HelpCircle
                            size={16}
                            className="ext-ticket-reason-icon-low"
                          />
                        )}
                        <span
                          className={`ext-ticket-reason-text ${
                            isHigh
                              ? "ext-ticket-reason-text-high"
                              : "ext-ticket-reason-text-low"
                          }`}
                        >
                          {isHigh
                            ? "High Severity Alert"
                            : "Low Confidence (AI Uncertainty)"}
                        </span>
                      </div>
                      <div className="ext-ticket-time">
                        <Clock size={12} />
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="ext-ticket-body">
                      <div className="ext-ticket-top">
                        <div>
                          <div className="ext-ticket-farmer-row">
                            <h3 className="ext-ticket-farmer-name">
                              Farmer: {ticket.farmerId}
                            </h3>
                            {ticket.contextData?.consentVerified && (
                              <span className="ext-consent-badge">
                                <CheckCircle size={10} /> Consent Verified
                              </span>
                            )}
                          </div>
                          <p className="ext-ticket-meta">
                            Field:{" "}
                            <span className="ext-ticket-mono">
                              {ticket.fieldId}
                            </span>
                            <span className="ext-ticket-dot">•</span>
                            Source:{" "}
                            <span className="ext-ticket-source">
                              {ticket.source === "Layer07"
                                ? "Disease Diagnosis"
                                : "AI Agro-Advisory"}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResolve(ticket.id)}
                          className="ext-btn-resolve"
                        >
                          Acknowledge &amp; Resolve
                        </button>
                      </div>

                      <div className="ext-ticket-payload">
                        <span className="ext-payload-label">
                          Context Data payload:
                        </span>
                        {JSON.stringify(ticket.contextData, null, 2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
