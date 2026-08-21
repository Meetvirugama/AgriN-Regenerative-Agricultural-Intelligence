import React, { useEffect, useState } from "react";
import { advisoryApi } from "../api/advisoryApi";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { mapSeverityToStatus } from "../../../types/status";
import { ErrorState } from "../../../components/ui/ErrorState";
import "./AdvisoryCard.css";

export const AdvisoryCard = ({ fieldId }) => {
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [escalationSent, setEscalationSent] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAdvisory = async () => {
      try {
        setLoading(true);
        const data = await advisoryApi.getAdvisory(fieldId);
        setAdvisory(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisory();
  }, [fieldId]);

  if (error) {
    return (
      <ErrorState 
        title="AI Advisory Failed" 
        message="Failed to load AI advisory." 
      />
    );
  }

  const handleFeedback = async (action) => {
    if (action === "overridden" && !showOverrideInput) {
      setShowOverrideInput(true);
      return;
    }
    if (advisory) {
      await advisoryApi.submitFeedback(fieldId, advisory.id, {
        action,
        reason: action === "overridden" ? overrideReason : undefined,
      });
      setFeedbackGiven(true);
      setShowOverrideInput(false);
    }
  };

  if (loading) {
    return (
      <Card className="advisory-skeleton">
        <div className="advisory-skeleton-line-1"></div>
        <div className="advisory-skeleton-line-2"></div>
        <div className="advisory-skeleton-line-3"></div>
        <div className="advisory-skeleton-buttons">
          <div className="advisory-skeleton-btn"></div>
          <div className="advisory-skeleton-btn"></div>
        </div>
      </Card>
    );
  }

  if (!advisory) {
    return null;
  }

  // Handle the "No action needed" state
  if (
    advisory.action_text?.toLowerCase().includes("no action needed") ||
    advisory.severity === "Low"
  ) {
    return (
      <Card className="advisory-card-good">
        <h3 className="advisory-card-good-title">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Conditions are good
        </h3>
        <p className="advisory-card-good-desc">
          Nothing to do today. We'll keep monitoring your field.
        </p>
      </Card>
    );
  }

  const status = mapSeverityToStatus(advisory.severity);
  const statusColors = {
    healthy: "bg-success border-success",
    neutral: "bg-neutral border-neutral",
    info: "bg-info border-info",
    attention: "bg-warning border-warning",
    urgent: "bg-danger border-danger",
  };

  return (
    <Card className="advisory-card-main">
      <div
        className={`advisory-status-bar ${statusColors[status].split(" ")[0]}`}
      ></div>

      <div className="advisory-header">
        <h3 className="advisory-title">
          AgriMesh Advisory
          <TextToSpeechButton
            textToRead={`AgriMesh Advisory: ${advisory.severity} Priority. ${advisory.action_text} ${advisory.action_deadline}. ${advisory.what_text} ${advisory.why_text}. What to monitor: ${advisory.monitor_text}`}
            className="w-8 h-8 p-1"
          />
        </h3>
        <StatusBadge status={status}>{advisory.severity} Priority</StatusBadge>
      </div>

      <div className="advisory-content">
        <p className="advisory-action">
          {advisory.action_text}{" "}
          <span className="advisory-deadline">{advisory.action_deadline}</span>.
        </p>

        <p className="advisory-desc">
          {advisory.what_text} {advisory.why_text}
        </p>

        {advisory.historical_parallel_callout && (
          <div className="advisory-historical">
            <svg
              className="advisory-historical-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="advisory-historical-text">
              {advisory.historical_parallel_callout}
            </p>
          </div>
        )}

        <p className="advisory-monitor">
          <span className="advisory-monitor-label">
            What to monitor
          </span>
          {advisory.monitor_text}
        </p>
      </div>

      {!feedbackGiven ? (
        <div className="advisory-feedback-container">
          <p className="advisory-feedback-label">
            Farmer Response
          </p>
          <div className="advisory-feedback-buttons">
            <Button size="sm" onClick={() => handleFeedback("followed")}>
              I'll do this
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleFeedback("ignored")}
            >
              Already did
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleFeedback("overridden")}
            >
              Doesn't seem right
            </Button>
          </div>

          {showOverrideInput && (
            <div className="advisory-override-container">
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why not? (e.g. Too wet to spray)"
                className="advisory-override-input"
                autoFocus
              />

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleFeedback("overridden")}
                disabled={!overrideReason.trim()}
              >
                Submit
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="advisory-feedback-success">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Response recorded.
        </div>
      )}

      <div className="advisory-sources">
        Sources: {(advisory.source_layers ?? []).join(" • ")}
      </div>

      {status === "urgent" && !escalationSent && (
        <div className="advisory-escalation">
          <h4 className="advisory-escalation-title">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            High Severity Risk Detected
          </h4>
          <p className="advisory-escalation-desc">
            This issue could significantly impact your yield. We recommend
            escalating this data to an extension officer for review.
          </p>

          <div className="advisory-consent-container">
            <input
              type="checkbox"
              id="advisory-consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="advisory-consent-checkbox"
            />

            <label
              htmlFor="advisory-consent"
              className="advisory-consent-label"
            >
              I consent to share this advisory, my field history, and satellite
              context with my local extension network.
            </label>
          </div>

          <Button
            disabled={!consentGiven}
            variant="destructive"
            className="w-full"
            onClick={async () => {
              try {
                const { escalationApi } =
                  await import("../../escalation-dashboard/api/escalationApi");
                await escalationApi.triggerEscalation(
                  fieldId,
                  "high_severity",
                  "Layer09",
                  {
                    issue: advisory.what_text,
                    action: advisory.action_text,
                    consentVerified: true,
                  },
                );
                setEscalationSent(true);
              } catch (e) {
                console.error("Failed to escalate", e);
              }
            }}
          >
            Escalate to Agronomist
          </Button>
        </div>
      )}

      {escalationSent && (
        <div className="advisory-escalation-success">
          <p className="advisory-escalation-success-title">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Escalation Sent
          </p>
          <p className="advisory-escalation-success-desc">
            An expert will review your field data.
          </p>
        </div>
      )}
    </Card>
  );
};
