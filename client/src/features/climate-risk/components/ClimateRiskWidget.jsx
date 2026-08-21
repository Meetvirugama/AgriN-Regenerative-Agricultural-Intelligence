import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  RefreshCw,
  ShieldAlert,
  ThermometerSun,
  Wind,
} from "lucide-react";

import { request } from "../../../services/apiClient";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { mapSeverityToStatus } from "../../../types/status";
import "./ClimateRiskWidget.css";


// ─── Constants ──────────────────────────────────────────────────────────────

const EMPTY_RISK = {
  severity: "unknown",
  riskType: "Climate Risk",
  timeframe: "Not available",
  protectiveAction: "Climate risk information is not available yet.",
  primaryRisks: [],
};

// Maps a status string to a CSS class modifier on the card.
// "urgent" covers both "critical" and "high" from the backend.
const STATUS_CARD_CLASS = {
  urgent: "crw-card-urgent",
  attention: "crw-card-attention",
  healthy: "crw-card-healthy",
  info: "crw-card-info",
  neutral: "crw-card-neutral",
};


// ─── Pure helper functions ───────────────────────────────────────────────────

function getRiskIcon(riskType) {
  const normalized = String(riskType || "").toLowerCase();

  if (normalized.includes("heat") || normalized.includes("drought")) {
    return ThermometerSun;
  }
  if (normalized.includes("rain") || normalized.includes("water")) {
    return CloudRain;
  }
  if (normalized.includes("wind")) {
    return Wind;
  }

  return AlertTriangle;
}

function getSeverityLabel(severity) {
  switch (String(severity || "").toLowerCase()) {
    case "critical":
      return "Critical";
    case "high":
      return "High Risk";
    case "medium":
      return "Moderate Risk";
    case "low":
      return "Low Risk";
    default:
      return "Unknown";
  }
}

function validateClimateRisk(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const severity =
    typeof payload.severity === "string" ? payload.severity : "unknown";

  const riskType =
    typeof payload.riskType === "string" && payload.riskType.trim()
      ? payload.riskType.trim()
      : "Climate Risk";

  const timeframe =
    typeof payload.timeframe === "string" && payload.timeframe.trim()
      ? payload.timeframe.trim()
      : "Not available";

  const protectiveAction =
    typeof payload.protectiveAction === "string" &&
    payload.protectiveAction.trim()
      ? payload.protectiveAction.trim()
      : "No protective action is currently available.";

  const primaryRisks = Array.isArray(payload.primaryRisks)
    ? payload.primaryRisks.filter(
        (risk) => typeof risk === "string" && risk.trim().length > 0
      )
    : [];

  return { severity, riskType, timeframe, protectiveAction, primaryRisks };
}


// ─── Component ───────────────────────────────────────────────────────────────

export function ClimateRiskWidget({ fieldId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRisk = useCallback(async () => {
    if (!fieldId) {
      setError("No field selected.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await request(
        `fields/${encodeURIComponent(fieldId)}/climate-risk`
      );

      const validated = validateClimateRisk(result);

      if (!validated) {
        throw new Error("Climate risk service returned an invalid response.");
      }

      setData(validated);
    } catch (err) {
      console.error("[ClimateRiskWidget] Failed to load climate risk:", err);
      setData(null);
      setError(err?.message || "Unable to load climate risk information.");
    } finally {
      setLoading(false);
    }
  }, [fieldId]);


  // Use a cancellation flag to prevent state updates on unmounted components.
  // NOTE: fetchRisk itself still runs to completion, but its state setters are
  // no-ops after the component unmounts. React 18 silently ignores these, but
  // the flag is kept as an explicit guard for clarity.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fetchRisk();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchRisk]);


  // Memoize resolved display data so downstream renders are stable.
  const normalizedData = useMemo(() => data || EMPTY_RISK, [data]);


  // ── Render: loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <LoadingSkeleton
        message="Analyzing climate risks from the latest forecast..."
      />
    );
  }

  // ── Render: error ────────────────────────────────────────────────
  // FIX: ErrorState accepts `onAction` (a callback), NOT a JSX `action` node.
  // The previous code passed action={<button>} which was silently discarded,
  // meaning the "Try again" button never appeared.
  if (error) {
    return (
      <ErrorState
        title="Unable to load climate risk"
        message={error}
        actionLabel="Try again"
        onAction={fetchRisk}
      />
    );
  }


  // ── Render: success ──────────────────────────────────────────────
  const status = mapSeverityToStatus(normalizedData.severity);
  const Icon = getRiskIcon(normalizedData.riskType);
  const severityLabel = getSeverityLabel(normalizedData.severity);
  const cardClass = STATUS_CARD_CLASS[status] ?? STATUS_CARD_CLASS.neutral;
  const isUnknown = normalizedData.severity === "unknown";

  return (
    <Card className={`crw-card ${cardClass}`} aria-live="polite">
      <div className="crw-body">

        {/* Header */}
        <div className="crw-header">
          <div className="crw-header-left">
            <div className="crw-icon-box">
              <Icon className="crw-icon" aria-hidden="true" />
            </div>

            <div className="crw-meta">
              <div className="crw-title-row">
                <h3 className="crw-title">{normalizedData.riskType}</h3>
                <StatusBadge status={status}>{severityLabel}</StatusBadge>
              </div>

              <p className="crw-timeframe">{normalizedData.timeframe}</p>
            </div>
          </div>
        </div>


        {/* Unknown / insufficient-data state */}
        {isUnknown ? (
          <div className="crw-unknown">
            <div className="crw-unknown-inner">
              <ShieldAlert className="crw-unknown-icon" aria-hidden="true" />
              <div>
                <p className="crw-unknown-title">More information is needed</p>
                <p className="crw-unknown-desc">
                  The available weather and field context is not sufficient to
                  produce a reliable climate-risk assessment.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Protective action */}
            <div className="crw-section">
              <p className="crw-section-label">What to do</p>
              <p className="crw-action-text">{normalizedData.protectiveAction}</p>
            </div>

            {/* Primary risks list */}
            {normalizedData.primaryRisks.length > 0 && (
              <div className="crw-risks">
                <p className="crw-risks-label">Primary risks</p>
                <ul className="crw-risk-list">
                  {normalizedData.primaryRisks.map((risk, index) => (
                    <li key={`${risk}-${index}`} className="crw-risk-item">
                      <span className="crw-risk-bullet" aria-hidden="true" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
