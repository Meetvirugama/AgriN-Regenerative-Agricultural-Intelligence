import React from "react";
import { useSatelliteHealth } from "../hooks/useSatelliteHealth";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Satellite, AlertTriangle, CloudRain, CheckCircle, Info, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";

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
      <section className="glass-card p-6 sm:p-8 rounded-3xl animate-pulse" aria-busy="true">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/60 mb-2">SATELLITE HEALTH</div>
            <h2 className="text-2xl font-black tracking-tight text-text">Field observation</h2>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-neutral/10 rounded-2xl w-full"></div>
          <div className="h-10 bg-neutral/10 rounded-xl w-3/4"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-card p-6 sm:p-8 rounded-3xl">
        <div className="mb-6">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/60 mb-2">SATELLITE HEALTH</div>
          <h2 className="text-2xl font-black tracking-tight text-text">Field observation</h2>
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
      <section className="glass-card p-6 sm:p-8 rounded-3xl">
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
    <section className="glass-card hover-lift p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
      
      {/* Premium Gradient Backdrops */}
      <div className="absolute -right-24 -top-24 w-64 h-64 bg-primary/10 rounded-full blur-[60px] opacity-70 group-hover:bg-primary/20 transition-colors duration-700 pointer-events-none"></div>
      <div className="absolute -left-12 bottom-0 w-48 h-48 bg-info/10 rounded-full blur-[50px] opacity-50 group-hover:bg-info/20 transition-colors duration-700 pointer-events-none"></div>

      <div className="flex justify-between items-start gap-4 relative z-10 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
            <Satellite size={14} className="text-primary" /> SATELLITE HEALTH
          </div>
          <h2 className="text-3xl font-black tracking-tight text-text">Orbital Scan</h2>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-neutral/10 text-text font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shrink-0 border border-border shadow-sm active:scale-95"
          onClick={refetch}
          disabled={refreshing}
          aria-label="Refresh satellite health"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-primary" : "text-primary"} />
          {refreshing ? "Scanning..." : "Sync"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-surface/50 border border-white/40 backdrop-blur-md relative z-10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)] dark:shadow-none">
        
        {/* Large Score Display */}
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
          <span className="block text-xs font-black text-text-muted uppercase tracking-[0.15em] mb-1">Index Score</span>
          <div className="flex items-baseline gap-2">
            {data.healthScore !== null ? (
              <>
                <strong className={`text-6xl sm:text-7xl font-black tracking-tighter ${scoreColorClass} ${glowClass}`}>
                  {Math.round(data.healthScore)}
                </strong>
                <span className="text-lg font-bold text-text-muted">/ 100</span>
              </>
            ) : (
              <strong className="text-5xl font-black text-text-muted/40 tracking-tighter">—</strong>
            )}
          </div>
          <span className={`mt-1 text-sm font-black uppercase tracking-widest ${scoreColorClass}`}>
            {healthLabel}
          </span>
        </div>

        {/* Dynamic Trends */}
        <div className="w-full sm:w-auto flex flex-col gap-3 sm:border-l sm:border-border/60 sm:pl-8">
          <div className="flex flex-col items-start bg-white/40 dark:bg-black/20 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">NDVI Trend</span>
            <TrendBadge trend={data.vegetationTrend} />
          </div>
          <div className="flex flex-col items-start bg-white/40 dark:bg-black/20 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Moisture</span>
            <TrendBadge trend={data.moistureTrend} />
          </div>
        </div>
      </div>

      {/* Provenance Badge */}
      <div className="mt-6 flex justify-end relative z-10">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
          isCloudObscured ? 'bg-warning/10 text-warning-strong border-warning/20' : 
          isSimulated ? 'bg-info/10 text-info border-info/20' : 'bg-success/10 text-success-strong border-success/20'
        }`}>
          {isCloudObscured ? <CloudRain size={12} /> : isSimulated ? <Info size={12} /> : <CheckCircle size={12} />}
          {isCloudObscured ? "Obscured by clouds (Simulated fallback)" : isSimulated ? "Simulated Demo Data" : "Verified Copernicus Sentinel-2"}
        </div>
      </div>

      {data.anomaly && (
        <div className="flex gap-4 mt-6 p-5 rounded-2xl bg-error/10 border border-error/20 relative z-10 backdrop-blur-sm">
          <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-error-strong text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <strong className="block text-base font-black text-error-strong">{data.anomaly.title || "Critical Anomaly Detected"}</strong>
            <p className="mt-0.5 text-sm font-bold text-error-strong/80">
              {data.anomaly.description || "A sudden shift in vegetation index was detected."}
            </p>
          </div>
        </div>
      )}

      {/* Synthesis Section */}
      <div className="mt-8 pt-6 border-t border-border/50 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Synthesis</span>
          <TextToSpeechButton textToRead={`Satellite Synthesis: ${data.summary}`} className="w-7 h-7 p-1.5 bg-surface rounded-full shadow-sm" />
        </div>
        <p className="text-base font-medium leading-relaxed text-text max-w-xl">
          {data.summary}
        </p>
      </div>

      {data.imageUrl && (
        <div className="mt-6 rounded-3xl overflow-hidden bg-black/5 border border-white/20 relative z-10 shadow-inner group-hover:shadow-md transition-shadow">
          <img
            src={data.imageUrl}
            alt="Latest satellite observation"
            className="w-full h-auto max-h-[300px] object-cover mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        </div>
      )}
    </section>
  );
}
