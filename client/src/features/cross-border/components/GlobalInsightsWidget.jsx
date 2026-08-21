import React, { useEffect, useState } from "react";
import { crossBorderApi } from "../api/crossBorderApi";
import { Globe2, TrendingUp, Lightbulb, MapPin, Activity } from "lucide-react";
import "./GlobalInsightsWidget.css";

export const GlobalInsightsWidget = ({ fieldId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Guard: don't attempt a fetch if there is no fieldId
    if (!fieldId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        // crossBorderApi.getInsights() already returns the insights array
        const data = await crossBorderApi.getInsights(fieldId);
        if (!cancelled) {
          setInsights(data);
        }
      } catch (err) {
        console.error("[GlobalInsightsWidget] Failed to fetch insights:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load global insights.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInsights();

    return () => {
      cancelled = true;
    };
  }, [fieldId]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="giw-skeleton">
        <div className="giw-skeleton-title"></div>
        <div className="giw-skeleton-body"></div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="giw-error">
        <div className="giw-header">
          <div className="giw-header-icon-box giw-header-icon-box-error">
            <Globe2 size={20} />
          </div>
          <h2 className="giw-header-title">Global Insights</h2>
        </div>
        <p className="giw-error-message">{error}</p>
      </div>
    );
  }

  // ── Empty — render nothing rather than an empty card ─────────────
  if (insights.length === 0) {
    return null;
  }

  // ── Success ───────────────────────────────────────────────────────
  return (
    <div className="giw-card">
      {/* Decorative background globe */}
      <div className="giw-bg-globe" aria-hidden="true">
        <Globe2 size={120} />
      </div>

      <div className="giw-content">
        <div className="giw-full-header">
          <div className="giw-header-icon-box giw-header-icon-box-normal">
            <Globe2 size={20} />
          </div>
          <div>
            <h2 className="giw-header-title">Global Insights</h2>
            <p className="giw-header-text-subtitle">
              Layer 14 Cross-Border Intelligence
            </p>
          </div>
        </div>

        <ul className="giw-list">
          {insights.map((insight) => (
            <li key={insight.id} className="giw-insight-card">
              <div className="giw-insight-meta">
                <span className="giw-region-badge">
                  <MapPin size={12} />
                  {insight.sourceRegion}
                </span>
                <span className="giw-adoption-rate">
                  <TrendingUp size={12} />
                  {insight.adoptionRate}% Adoption
                </span>
              </div>

              {/* Climate zone contextual quote */}
              <p className="giw-climate-zone">
                &ldquo;Similar farms in the {insight.comparableClimateZone}{" "}
                climate have found that...&rdquo;
              </p>

              <div className="giw-recommendation">
                <div className="giw-recommendation-icon">
                  {insight.insightType === "practice" ? (
                    <Lightbulb
                      size={20}
                      className="giw-recommendation-icon-practice"
                    />
                  ) : (
                    <Activity
                      size={20}
                      className="giw-recommendation-icon-risk"
                    />
                  )}
                </div>
                <p className="giw-recommendation-text">
                  {insight.recommendation}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
