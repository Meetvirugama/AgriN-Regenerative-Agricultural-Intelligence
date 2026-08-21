import React, { useState } from "react";
import { SoilUploadFlow } from "./SoilUploadFlow";
import { Leaf, FileText, Info, FlaskConical, Droplets, Droplet, Hash, UploadCloud, ChevronRight } from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";
import "./SoilSummaryCard.css";

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
    summary: source.summary || source.summary_text || (source.source === "lab" ? "Soil measurements successfully extracted from your uploaded lab report." : "Soil information is currently based on available regional data."),
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
      <section className="glass-card hover-lift soil-card-container group" aria-labelledby="soil-health-title">
        
        {/* Background Accent */}
        <div className={`soil-card-backdrop soil-card-backdrop-primary ${isLabReport ? 'bg-success' : 'bg-warning'}`}></div>
        <div className="soil-card-backdrop soil-card-backdrop-secondary"></div>

        <div className="soil-card-header">
          <div>
            <div className="soil-card-eyebrow">
              <Droplet size={14} className={isLabReport ? "text-success" : "text-warning"} /> SOIL HEALTH
            </div>
            <h2 id="soil-health-title" className="soil-card-title">
              Soil Composition
            </h2>
            <p className="soil-card-desc">
              {isLabReport ? "Based on your uploaded laboratory report." : "Regional estimate for this field."}
            </p>
          </div>

          <span className={`soil-card-source-badge ${isLabReport ? "soil-card-source-badge-lab" : "soil-card-source-badge-regional"}`}>
            {isLabReport ? <FileText size={14} /> : <Info size={14} />}
            {normalized.sourceLabel}
          </span>
        </div>

        <div className="soil-card-summary-box">
          <div className="soil-card-summary-content">
            <div className="soil-card-summary-header">
              <span className="soil-card-summary-eyebrow">Analysis Summary</span>
              <TextToSpeechButton textToRead={`Soil Condition: ${normalized.summary}`} className="w-7 h-7 p-1.5 bg-white/50 rounded-full shadow-sm" />
            </div>
            <p className="soil-card-summary-text">{normalized.summary}</p>
            {normalized.confidence !== null && (
              <div className="soil-card-confidence">
                Confidence: 
                <span className={`soil-card-confidence-badge ${normalized.confidence > 0.8 ? "soil-card-confidence-badge-high" : "soil-card-confidence-badge-low"}`}>
                  {Math.round(Number(normalized.confidence) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="soil-card-metrics-grid">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            // Provide different colors for different metrics
            const colors = ['text-info', 'text-success', 'text-primary', 'text-warning'];
            const iconColor = colors[idx % colors.length];
            return (
              <div key={metric.key} className="soil-card-metric-item group/metric">
                <div className={`soil-card-metric-icon-wrapper ${iconColor}`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="soil-card-metric-content">
                  <span className="soil-card-metric-label">{metric.label}</span>
                  <strong className="soil-card-metric-value">{metric.value}</strong>
                  <span className="soil-card-metric-desc">{metric.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="soil-card-footer">
          <button
            type="button"
            className="soil-card-upload-btn group"
            onClick={() => setIsUploadOpen(true)}
            disabled={disabled}
          >
            <UploadCloud size={16} />
            Replace with Lab Report
            <ChevronRight size={14} className="soil-card-upload-chevron" />
          </button>

          {normalized.updatedAt && (
            <span className="soil-card-updated">
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
