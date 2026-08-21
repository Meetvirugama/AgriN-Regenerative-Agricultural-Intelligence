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
import { cn } from "../../../lib/cn";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { mapSeverityToStatus } from "../../../types/status";


const EMPTY_RISK = {
  severity: "unknown",
  riskType: "Climate Risk",
  timeframe: "Not available",
  protectiveAction:
    "Climate risk information is not available yet.",
  primaryRisks: [],
};


function getRiskIcon(riskType) {
  const normalized = String(riskType || "").toLowerCase();

  if (
    normalized.includes("heat") ||
    normalized.includes("drought")
  ) {
    return ThermometerSun;
  }

  if (
    normalized.includes("rain") ||
    normalized.includes("water")
  ) {
    return CloudRain;
  }

  if (normalized.includes("wind")) {
    return Wind;
  }

  return AlertTriangle;
}


function getSeverityLabel(severity) {
  switch (severity) {
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


function getSeverityClasses(status) {
  switch (status) {
    case "critical":
    case "urgent":
      return "border-danger/30 bg-danger/10 text-danger";

    case "warning":
    case "attention":
      return "border-warning/30 bg-warning/10 text-warning";

    case "healthy":
      return "border-success/30 bg-success/10 text-success";

    case "info":
      return "border-info/30 bg-info/10 text-info";

    default:
      return "border-border bg-surface text-text-muted";
  }
}


function validateClimateRisk(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const severity =
    typeof payload.severity === "string"
      ? payload.severity
      : "unknown";

  const riskType =
    typeof payload.riskType === "string" &&
    payload.riskType.trim()
      ? payload.riskType.trim()
      : "Climate Risk";

  const timeframe =
    typeof payload.timeframe === "string" &&
    payload.timeframe.trim()
      ? payload.timeframe.trim()
      : "Not available";

  const protectiveAction =
    typeof payload.protectiveAction === "string" &&
    payload.protectiveAction.trim()
      ? payload.protectiveAction.trim()
      : "No protective action is currently available.";

  const primaryRisks = Array.isArray(payload.primaryRisks)
    ? payload.primaryRisks.filter(
        (risk) =>
          typeof risk === "string" &&
          risk.trim().length > 0
      )
    : [];

  return {
    severity,
    riskType,
    timeframe,
    protectiveAction,
    primaryRisks,
  };
}


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
        throw new Error(
          "Climate risk service returned an invalid response."
        );
      }

      setData(validated);
    } catch (err) {
      console.error(
        "[ClimateRiskWidget] Failed to load climate risk:",
        err
      );

      setData(null);

      setError(
        err?.message ||
          "Unable to load climate risk information."
      );
    } finally {
      setLoading(false);
    }
  }, [fieldId]);


  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }

      await fetchRisk();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchRisk]);


  const normalizedData = useMemo(
    () => data || EMPTY_RISK,
    [data]
  );


  if (loading) {
    return (
      <LoadingSkeleton
        message="Analyzing climate risks from the latest forecast..."
      />
    );
  }


  if (error) {
    return (
      <ErrorState
        title="Unable to load climate risk"
        message={error}
        action={
          <button
            type="button"
            onClick={fetchRisk}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        }
      />
    );
  }


  const status = mapSeverityToStatus(
    normalizedData.severity
  );

  const Icon = getRiskIcon(
    normalizedData.riskType
  );

  const severityLabel = getSeverityLabel(
    normalizedData.severity
  );

  const severityClasses =
    getSeverityClasses(status);


  const isUnknown =
    normalizedData.severity === "unknown";


  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        severityClasses
      )}
      aria-live="polite"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-xl border border-border bg-surface p-2.5 shadow-sm">
              <Icon
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold tracking-tight">
                  {normalizedData.riskType}
                </h3>

                <StatusBadge status={status}>
                  {severityLabel}
                </StatusBadge>
              </div>

              <p className="text-sm font-medium opacity-80">
                {normalizedData.timeframe}
              </p>
            </div>
          </div>
        </div>


        {/* Unknown / insufficient-data state */}
        {isUnknown ? (
          <div className="mt-5 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              <div>
                <p className="font-semibold">
                  More information is needed
                </p>

                <p className="mt-1 text-sm text-text-muted">
                  The available weather and field context
                  is not sufficient to produce a reliable
                  climate-risk assessment.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Primary action */}
            <div className="mt-5 rounded-xl border border-border bg-surface p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider opacity-70">
                What to do
              </p>

              <p className="text-sm font-semibold leading-6 text-text">
                {normalizedData.protectiveAction}
              </p>
            </div>


            {/* Primary risks */}
            {normalizedData.primaryRisks.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider opacity-70">
                  Primary risks
                </p>

                <ul className="space-y-2">
                  {normalizedData.primaryRisks.map(
                    (risk, index) => (
                      <li
                        key={`${risk}-${index}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                          aria-hidden="true"
                        />

                        <span>{risk}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
