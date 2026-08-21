import React from "react";
import { useSatelliteHealth } from "../hooks/useSatelliteHealth";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Satellite, AlertTriangle, CloudRain, CheckCircle, Info, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";
import "./SatelliteHealthCard.css";

function getHealthLabel(score) {
  if (score === null || score === undefined) return "Unavailable";
  const numericScore = Number(score);
  if (numericScore >= 80) return "Excellent";
  if (numericScore >= 60) return "Watch";
  return "Needs attention";
}

function TrendBadge({ trend }) {
  if (!trend) return <span className="text-text-muted font-bold text-sm">Unavailable</span>;
  const normalized = String(trend).toLowerCase();
  
  if (normalized === "improving") {
    return (
      <div className="flex items-center gap-1.5 text-success-strong">
        <TrendingUp size={18} strokeWidth={3} className="animate-bounce" />
        <span className="font-black text-sm uppercase tracking-widest">Improving</span>
      </div>
    );
  }
  if (normalized === "declining") {
    return (
      <div className="flex items-center gap-1.5 text-error-strong">
        <TrendingDown size={18} strokeWidth={3} />
        <span className="font-black text-sm uppercase tracking-widest">Declining</span>
      </div>
    );
  }
  if (normalized === "stable") {
    return (
      <div className="flex items-center gap-1.5 text-info">
        <Minus size={18} strokeWidth={3} />
        <span className="font-black text-sm uppercase tracking-widest">Stable</span>
      </div>
    );
  }
  
  return <span className="font-bold text-sm capitalize">{String(trend)}</span>;
}

export function SatelliteHealthCard({ fieldId, enabled = true }) {
  const { data, loading, refreshing, error, refetch } = useSatelliteHealth({
    fieldId,
    enabled,
  });

  if (loading) {
    return (
      <section className="glass-card satellite-card-skeleton" aria-busy="true">
        <div className="mb-6">
          <div className="satellite-card-skeleton-eyebrow">SATELLITE HEALTH</div>
          <h2 className="satellite-card-skeleton-title">Field observation</h2>
        </div>
        <div className="satellite-card-skeleton-body">
          <div className="satellite-card-skeleton-img"></div>
          <div className="satellite-card-skeleton-text"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-card satellite-card-error">
        <div className="mb-6">
          <div className="satellite-card-eyebrow">SATELLITE HEALTH</div>
          <h2 className="satellite-card-title">Field observation</h2>
        </div>
        <ErrorState
          title="Satellite data unavailable"
          message={error.message}
          actionLabel="Retry"
          onAction={refetch}
        />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="glass-card satellite-card-error">
        <ErrorState
          title="No satellite data"
          message="There is no satellite observation available for this field yet."
          actionLabel="Check again"
          onAction={refetch}
        />
      </section>
    );
  }

  const isSimulated = data.data_source === "simulated" || data.data_quality === "simulated" || data.data_quality === "unavailable_cloud_cover";
  const isCloudObscured = data.data_quality === "unavailable_cloud_cover";
  const healthLabel = getHealthLabel(data.healthScore);
  
  let scoreColorClass = "text-text-muted";
  let glowClass = "";
  if (data.healthScore >= 80) {
    scoreColorClass = "text-success-strong";
    glowClass = "pulse-glow";
  } else if (data.healthScore >= 60) {
    scoreColorClass = "text-warning-strong";
  } else if (data.healthScore !== null) {
    scoreColorClass = "text-error-strong";
  }

  return (
    <section className="glass-card hover-lift satellite-card-container group">
      
      {/* Premium Gradient Backdrops */}
      <div className="satellite-card-backdrop satellite-card-backdrop-primary"></div>
      <div className="satellite-card-backdrop satellite-card-backdrop-info"></div>

      <div className="satellite-card-header">
        <div>
          <div className="satellite-card-eyebrow">
            <Satellite size={14} className="satellite-card-eyebrow-icon" /> SATELLITE HEALTH
          </div>
          <h2 className="satellite-card-title">Orbital Scan</h2>
        </div>

        <button
          type="button"
          className="satellite-card-sync-btn"
          onClick={refetch}
          disabled={refreshing}
          aria-label="Refresh satellite health"
        >
          <RefreshCw size={14} className={`satellite-card-sync-btn-icon ${refreshing ? "spinning" : ""}`} />
          {refreshing ? "Scanning..." : "Sync"}
        </button>
      </div>

      <div className="satellite-card-metrics-row">
        
        {/* Large Score Display */}
        <div className="satellite-card-score-container">
          <span className="satellite-card-score-label">Index Score</span>
          <div className="satellite-card-score-value-wrapper">
            {data.healthScore !== null ? (
              <>
                <strong className={`satellite-card-score-value ${scoreColorClass} ${glowClass}`}>
                  {Math.round(data.healthScore)}
                </strong>
                <span className="satellite-card-score-max">/ 100</span>
              </>
            ) : (
              <strong className="satellite-card-score-value-empty">—</strong>
            )}
          </div>
          <span className={`satellite-card-score-status ${scoreColorClass}`}>
            {healthLabel}
          </span>
        </div>

        {/* Dynamic Trends */}
        <div className="satellite-card-trends-container">
          <div className="satellite-card-trend-box">
            <span className="satellite-card-trend-label">NDVI Trend</span>
            <TrendBadge trend={data.vegetationTrend} />
          </div>
          <div className="satellite-card-trend-box">
            <span className="satellite-card-trend-label">Moisture</span>
            <TrendBadge trend={data.moistureTrend} />
          </div>
        </div>
      </div>

      {/* Provenance Badge */}
      <div className="satellite-card-provenance">
        <div className={`satellite-card-provenance-badge ${
          isCloudObscured ? 'satellite-card-provenance-badge-obscured' : 
          isSimulated ? 'satellite-card-provenance-badge-simulated' : 'satellite-card-provenance-badge-verified'
        }`}>
          {isCloudObscured ? <CloudRain size={12} /> : isSimulated ? <Info size={12} /> : <CheckCircle size={12} />}
          {isCloudObscured ? "Obscured by clouds (Simulated fallback)" : isSimulated ? "Simulated Demo Data" : "Verified Copernicus Sentinel-2"}
        </div>
      </div>

      {data.anomaly && (
        <div className="satellite-card-anomaly">
          <div className="satellite-card-anomaly-icon-wrapper">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="satellite-card-anomaly-content">
            <strong className="satellite-card-anomaly-title">
              Vegetation Decline in {data.anomaly.location}
            </strong>
            <p className="satellite-card-anomaly-desc">
              A sudden {data.anomaly.dropPercentage}% drop in NDVI was detected.
            </p>
          </div>
        </div>
      )}

      {/* Synthesis Section */}
      <div className="satellite-card-synthesis">
        <div className="satellite-card-synthesis-header">
          <span className="satellite-card-synthesis-eyebrow">Synthesis</span>
          <TextToSpeechButton textToRead={`Satellite Synthesis: ${data.summary}`} className="w-7 h-7 p-1.5 bg-surface rounded-full shadow-sm" />
        </div>
        <p className="satellite-card-synthesis-text">
          {data.summary}
        </p>
      </div>

      {data.imageUrl && (
        <div className="satellite-card-image-container">
          <img
            src={data.imageUrl}
            alt="Latest satellite observation"
            className="satellite-card-image"
            loading="lazy"
          />
        </div>
      )}
    </section>
  );
}
