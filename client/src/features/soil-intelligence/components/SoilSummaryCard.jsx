  import React, { useState } from "react";
import { SoilUploadFlow } from "./SoilUploadFlow";
import { Leaf, FileText, Info, FlaskConical, Droplets, Droplet, Hash, UploadCloud, ChevronRight } from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";

const FALLBACK_METRICS = [
  { key: "texture", label: "Texture", icon: FlaskConical, description: "Soil particle composition" },
  { key: "organicMatter", label: "Organic Matter", icon: Leaf, description: "Organic material level" },
  { key: "waterHolding", label: "Water Holding", icon: Droplets, description: "Estimated water retention" },
  { key: "ph", label: "pH Level", icon: Hash, description: "Soil acidity / alkalinity" },
];

function normalizeMetricValue(value) {
  if (value === null || value === undefined || value === "") return "Unavailable";
  return String(value);
}

function normalizeSoilData(soil) {
  const source = soil || {};
  return {
    source: source.source || "regional",
    sourceLabel: source.sourceLabel || (source.source === "lab" ? "Lab Report" : "Regional Estimate"),
    confidence: source.confidence ?? null,
    summary: source.summary || "Soil information is currently based on available regional data.",
    metrics: {
      texture: normalizeMetricValue(source.texture),
      organicMatter: normalizeMetricValue(source.organicMatter ?? source.organic_matter),
      waterHolding: normalizeMetricValue(source.waterHolding ?? source.water_holding),
      ph: normalizeMetricValue(source.ph ?? source.pH),
    },
    updatedAt: source.updatedAt || source.updated_at || null,
  };
}

export function SoilSummaryCard({ fieldId, soil, onSoilUpdated, disabled = false }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const normalized = normalizeSoilData(soil);
  
  const metrics = FALLBACK_METRICS.map((metric) => ({
    ...metric,
    value: normalized.metrics[metric.key],
  }));

  const isLabReport = normalized.source === "lab";

  return (
    <>
      <section className="glass-card hover-lift p-6 sm:p-8 rounded-3xl relative overflow-hidden group" aria-labelledby="soil-health-title">
        
        {/* Background Accent */}
        <div className={`absolute -left-16 -top-16 w-64 h-64 rounded-full blur-[60px] opacity-30 transition-colors duration-700 pointer-events-none ${isLabReport ? 'bg-success' : 'bg-warning'}`}></div>
        <div className="absolute -right-12 bottom-0 w-48 h-48 bg-primary/10 rounded-full blur-[50px] opacity-40 group-hover:bg-primary/20 transition-colors duration-700 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
              <Droplet size={14} className={isLabReport ? "text-success" : "text-warning"} /> SOIL HEALTH
            </div>
            <h2 id="soil-health-title" className="text-3xl font-black tracking-tight text-text flex items-center gap-3">
              Soil Composition
            </h2>
            <p className="text-sm font-medium text-text-muted mt-2 leading-relaxed max-w-sm">
              {isLabReport ? "Based on your uploaded laboratory report." : "Regional estimate for this field."}
            </p>
          </div>

          <span className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 border shadow-sm
            ${isLabReport ? "bg-success/10 text-success-strong border-success/20" : "bg-warning/10 text-warning-strong border-warning/20"}
          `}>
            {isLabReport ? <FileText size={14} /> : <Info size={14} />}
            {normalized.sourceLabel}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mt-8 p-6 rounded-3xl bg-surface/50 border border-white/40 backdrop-blur-md relative z-10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)] dark:shadow-none">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="block text-xs font-black text-text-muted uppercase tracking-wider">Analysis Summary</span>
              <TextToSpeechButton textToRead={`Soil Condition: ${normalized.summary}`} className="w-7 h-7 p-1.5 bg-white/50 rounded-full shadow-sm" />
            </div>
            <p className="text-base font-medium leading-relaxed text-text max-w-xl">{normalized.summary}</p>
            {normalized.confidence !== null && (
              <div className="mt-4 text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                Confidence: 
                <span className={`px-2 py-0.5 rounded-full ${normalized.confidence > 0.8 ? "bg-success/10 text-success-strong" : "bg-warning/10 text-warning-strong"}`}>
                  {Math.round(Number(normalized.confidence) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 relative z-10">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            // Provide different colors for different metrics
            const colors = ['text-info', 'text-success', 'text-primary', 'text-warning'];
            const iconColor = colors[idx % colors.length];
            return (
              <div key={metric.key} className="flex flex-col items-start gap-3 p-4 sm:p-5 border border-white/40 rounded-2xl bg-surface/40 hover:bg-white/60 transition-colors backdrop-blur-sm shadow-sm group/metric cursor-default">
                <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white shadow-sm ${iconColor} group-hover/metric:scale-110 transition-transform`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 w-full">
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">{metric.label}</span>
                  <strong className="block mt-1 text-xl font-black truncate capitalize text-text/90 group-hover/metric:text-text transition-colors">{metric.value}</strong>
                  <span className="block mt-1 text-[10px] font-medium text-text-muted/70 leading-tight">{metric.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-border/50 relative z-10">
          <button
            type="button"
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral/10 hover:bg-primary hover:text-white text-text font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 border border-border hover:border-primary shadow-sm"
            onClick={() => setIsUploadOpen(true)}
            disabled={disabled}
          >
            <UploadCloud size={16} />
            Replace with Lab Report
            <ChevronRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </button>

          {normalized.updatedAt && (
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Updated {new Date(normalized.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </section>

      {isUploadOpen && (
        <SoilUploadFlow
          fieldId={fieldId}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(updatedSoil) => {
            setIsUploadOpen(false);
            onSoilUpdated?.(updatedSoil);
          }}
        />
      )}
    </>
  );
}
