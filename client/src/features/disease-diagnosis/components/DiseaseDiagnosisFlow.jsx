import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  ScanSearch,
  Check,
  AlertTriangle,
  PhoneCall,
  HelpCircle,
  ImageIcon,
  Leaf,
  CloudRain,
  Satellite,
  Mountain,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  CircleCheck,
} from "lucide-react";
import { diagnosisApi } from "../api/diagnosisApi";
import { Dialog } from "../../../components/ui/Dialog";
import { Button } from "../../../components/ui/Button";
import "./DiseaseDiagnosisFlow.css";

/* ── Category → display config ──────────────────────────────────────────── */
const CATEGORY_CONFIG = {
  disease:             { label: "Disease",              color: "#ef4444", icon: "🦠" },
  pest:                { label: "Pest Infestation",     color: "#f97316", icon: "🐛" },
  nutrient_deficiency: { label: "Nutrient Deficiency",  color: "#eab308", icon: "⚗️" },
  water_stress:        { label: "Water Stress",         color: "#3b82f6", icon: "💧" },
  heat_stress:         { label: "Heat Stress",          color: "#f59e0b", icon: "🌡️" },
  healthy:             { label: "Healthy",              color: "#22c55e", icon: "✅" },
  unknown:             { label: "Unknown — Needs Expert", color: "#6b7280", icon: "❓" },
};

const SEVERITY_CONFIG = {
  low:      { label: "Low",      bg: "rgba(34,197,94,0.15)",   text: "#16a34a" },
  medium:   { label: "Moderate", bg: "rgba(234,179,8,0.15)",   text: "#a16207" },
  high:     { label: "High",     bg: "rgba(249,115,22,0.15)",  text: "#c2410c" },
  critical: { label: "Critical", bg: "rgba(239,68,68,0.15)",   text: "#dc2626" },
  none:     { label: "None",     bg: "rgba(34,197,94,0.15)",   text: "#16a34a" },
  unknown:  { label: "Unknown",  bg: "rgba(107,114,128,0.15)", text: "#6b7280" },
};

const SOURCE_ICON = {
  image:      <Camera size={13} />,
  weather:    <CloudRain size={13} />,
  satellite:  <Satellite size={13} />,
  soil:       <Mountain size={13} />,
  crop_stage: <Leaf size={13} />,
};

/* ── Confidence bar ──────────────────────────────────────────────────────── */
function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  const label = pct >= 75 ? "High" : pct >= 50 ? "Medium" : "Low";

  return (
    <div className="ddf-confidence">
      <div className="ddf-confidence-header">
        <span className="ddf-confidence-label-text">Confidence</span>
        <span className="ddf-confidence-value" style={{ color }}>{pct}% — {label}</span>
      </div>
      <div className="ddf-confidence-track">
        <div
          className="ddf-confidence-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ── Differential diagnosis list ─────────────────────────────────────────── */
function DifferentialList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="ddf-differential">
      <p className="ddf-section-label">Differential Diagnosis</p>
      {items.map((item, i) => {
        const pct = Math.round((item.probability ?? 0) * 100);
        const color = i === 0 ? "#22c55e" : i === 1 ? "#eab308" : "#6b7280";
        return (
          <div key={i} className="ddf-diff-item">
            <div className="ddf-diff-item-header">
              <span className="ddf-diff-condition">{item.condition}</span>
              <span className="ddf-diff-pct" style={{ color }}>{pct}%</span>
            </div>
            <div className="ddf-diff-track">
              <div className="ddf-diff-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            {item.rationale && (
              <p className="ddf-diff-rationale">{item.rationale}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Evidence graph ──────────────────────────────────────────────────────── */
function EvidenceGraph({ evidence }) {
  const [expanded, setExpanded] = useState(false);
  if (!evidence?.length) return null;

  const supporting = evidence.filter(e => e.supports_primary);
  const contrary   = evidence.filter(e => !e.supports_primary);

  return (
    <div className="ddf-evidence">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="ddf-evidence-toggle"
      >
        Evidence ({evidence.length} sources)
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="ddf-evidence-body">
          {supporting.map((e, i) => (
            <div key={i} className="ddf-evidence-row">
              <span className="ddf-evidence-icon ddf-evidence-icon-supporting">
                {SOURCE_ICON[e.source] ?? "•"}
              </span>
              <span className="ddf-evidence-finding">
                <strong className="ddf-evidence-source">{e.source}</strong>: {e.finding}
              </span>
              <CircleCheck size={13} className="ddf-evidence-check" />
            </div>
          ))}
          {contrary.map((e, i) => (
            <div key={i} className="ddf-evidence-row ddf-evidence-row-contrary">
              <span className="ddf-evidence-icon ddf-evidence-icon-contrary">
                {SOURCE_ICON[e.source] ?? "•"}
              </span>
              <span className="ddf-evidence-finding">
                <strong className="ddf-evidence-source">{e.source}</strong>: {e.finding}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export function DiseaseDiagnosisFlow({ fieldId, onClose }) {
  const [step, setStep] = useState("capture"); // capture | analyzing | result | escalation
  const [result, setResult] = useState(null);
  const [diagError, setDiagError] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [gps, setGps] = useState(null);
  const fileInputRef = useRef(null);

  // Try to get GPS position when component mounts
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {}, // Silently fail — GPS is optional
      { timeout: 5000, maximumAge: 60000 },
    );
  }, []);

  // Revoke the object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (capturedImageUrl) {
        URL.revokeObjectURL(capturedImageUrl);
      }
    };
  }, [capturedImageUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob URL before creating a new one
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }
    setCapturedBlob(file);
    setCapturedImageUrl(URL.createObjectURL(file));
    // Reset any previous result when user picks a new photo
    setResult(null);
    setDiagError(null);
    setStep("capture");
  };

  const handleAnalyze = async () => {
    if (!capturedBlob) return;
    setStep("analyzing");
    setDiagError(null);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // use onload not onloadend
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(capturedBlob);
      });

      const data = await diagnosisApi.diagnoseCrop(fieldId, base64, {
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
      });

      setResult(data);

      if (data.escalation_triggered || data.requires_expert) {
        setStep("escalation");
      } else {
        setStep("result");
      }
    } catch (err) {
      console.error("[Diagnosis]", err);
      setDiagError(err?.message || "Analysis failed. Please try again.");
      setStep("capture");
    }
  };

  const categoryConf = result
    ? (CATEGORY_CONFIG[result.condition_category] ?? CATEGORY_CONFIG.unknown)
    : null;
  const severityConf = result
    ? (SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.unknown)
    : null;

  return (
    <Dialog isOpen onClose={onClose} title="Crop Health Diagnosis" className="max-w-md">
      <div className="ddf-wrapper">

        {/* ── CAPTURE STEP ──────────────────────────────────────────────── */}
        {step === "capture" && (
          <div className="ddf-capture-step">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="ddf-file-input"
              onChange={handleFileChange}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
              className="ddf-drop-zone"
              aria-label="Select a photo of your crop"
            >
              {capturedImageUrl ? (
                <img src={capturedImageUrl} alt="Captured crop" className="ddf-preview-img" />
              ) : (
                <>
                  <div className="ddf-corner ddf-corner-tl" />
                  <div className="ddf-corner ddf-corner-tr" />
                  <div className="ddf-corner ddf-corner-bl" />
                  <div className="ddf-corner ddf-corner-br" />
                  <ImageIcon size={32} className="ddf-placeholder-icon" />
                  <span className="ddf-placeholder-text">Tap to add photo</span>
                </>
              )}
            </div>

            <h3 className="ddf-capture-title">Inspect Crop</h3>
            <p className="ddf-capture-subtitle">
              {capturedImageUrl
                ? "Photo selected. Ready to analyze."
                : "Take a clear close-up of the affected leaf or plant."}
            </p>

            {gps && (
              <p className="ddf-gps-text">
                📍 GPS: {gps.latitude.toFixed(4)}°, {gps.longitude.toFixed(4)}°
              </p>
            )}

            {/* Show error if previous attempt failed */}
            {diagError && (
              <div className="ddf-error-banner" role="alert">
                <AlertTriangle size={15} className="ddf-error-icon" />
                {diagError}
              </div>
            )}

            <div className="ddf-capture-actions">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                style={{ width: "100%" }}
              >
                <Camera size={18} />
                {capturedImageUrl ? "Retake Photo" : "Camera / Gallery"}
              </Button>
              <Button
                onClick={handleAnalyze}
                style={{ width: "100%" }}
                disabled={!capturedBlob}
              >
                <ScanSearch size={18} /> Analyze with AI
              </Button>
            </div>
          </div>
        )}

        {/* ── ANALYZING STEP ────────────────────────────────────────────── */}
        {step === "analyzing" && (
          <div className="ddf-analyzing-step">
            <Loader2 size={48} className="ddf-spinner" />
            <h3 className="ddf-analyzing-title">Analyzing your photo…</h3>
            <div className="ddf-analyzing-steps">
              <p>🌿 Reading visual symptoms</p>
              <p>🌧 Checking recent weather data</p>
              <p>🛰 Loading satellite NDVI trend</p>
              <p>🧪 Applying soil &amp; crop context</p>
            </div>
          </div>
        )}

        {/* ── RESULT STEP ───────────────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="ddf-result-step">

            {/* Image quality warning */}
            {result.image_quality === "poor" && (
              <div className="ddf-quality-warning" role="alert">
                <AlertTriangle size={15} className="ddf-quality-icon" />
                Poor image quality detected. Upload a closer, brighter photo for higher confidence.
              </div>
            )}

            {/* Condition header */}
            <div className="ddf-condition-header">
              <span className="ddf-condition-emoji" role="img" aria-label={categoryConf.label}>
                {categoryConf.icon}
              </span>
              <div className="ddf-condition-meta">
                <p className="ddf-meta-label">
                  Crop: <span className="ddf-meta-value">{result.crop_type || "Unknown"}</span>
                </p>
                <p className="ddf-meta-label">Likely Condition</p>
                <h2 className="ddf-condition-name">{result.condition_name}</h2>
                <span
                  className="ddf-category-badge"
                  style={{
                    background: categoryConf.color + "22",
                    color: categoryConf.color,
                  }}
                >
                  {categoryConf.label}
                </span>
              </div>
              <div
                className="ddf-severity-badge"
                style={{ background: severityConf.bg, color: severityConf.text }}
              >
                <ShieldAlert size={11} /> {severityConf.label}
              </div>
            </div>

            <ConfidenceBar confidence={result.confidence} />
            <EvidenceGraph evidence={result.evidence} />
            <DifferentialList items={result.differential_diagnosis} />

            {result.what_is_happening && (
              <div className="ddf-info-block">
                <p className="ddf-section-label">What is happening?</p>
                <p className="ddf-info-text">{result.what_is_happening}</p>
              </div>
            )}

            {result.why_is_it_happening && (
              <div className="ddf-info-block">
                <p className="ddf-section-label">Why?</p>
                <p className="ddf-info-text">{result.why_is_it_happening}</p>
              </div>
            )}

            {result.treatment_recommendation && (
              <div className="ddf-treatment-block">
                <p className="ddf-treatment-label">
                  <Check size={13} /> What to do
                </p>
                <p className="ddf-info-text">{result.treatment_recommendation}</p>
              </div>
            )}

            {result.action_timing && (
              <div className="ddf-info-block">
                <p className="ddf-section-label">When</p>
                <p className="ddf-info-text">{result.action_timing}</p>
              </div>
            )}

            {result.monitor && (
              <p className="ddf-monitor-text">
                📋 <span className="ddf-monitor-label">Monitor:</span> {result.monitor}
              </p>
            )}

            <div className="ddf-result-actions">
              <Button
                onClick={() => setStep("escalation")}
                variant="secondary"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}
              >
                <PhoneCall size={15} /> Talk to Expert
              </Button>
              <Button onClick={onClose} style={{ width: "100%" }}>Done</Button>
            </div>
          </div>
        )}

        {/* ── ESCALATION STEP ───────────────────────────────────────────── */}
        {step === "escalation" && result && (
          <div className="ddf-escalation-step">

            {result.condition_category === "unknown" || result.requires_expert ? (
              <div className="ddf-escalation-content">
                <div className="ddf-escalation-icon ddf-escalation-icon-warn">
                  <HelpCircle size={44} />
                </div>
                <h2 className="ddf-escalation-title">Unable to Diagnose Confidently</h2>
                <p className="ddf-escalation-desc">
                  Confidence is too low to make a safe recommendation. Please upload:
                </p>
                <ul className="ddf-escalation-list">
                  <li>A closer photo of the affected leaf</li>
                  <li>The underside of the leaf</li>
                  <li>A photo of the whole plant</li>
                </ul>
                <DifferentialList items={result.differential_diagnosis} />
              </div>
            ) : (
              <div className="ddf-escalation-content">
                <div className="ddf-escalation-icon ddf-escalation-icon-danger">
                  <AlertTriangle size={44} />
                </div>
                <h2 className="ddf-escalation-title">
                  High Severity — {categoryConf?.label}
                </h2>
                <p className="ddf-escalation-desc">
                  <strong>{result.condition_name}</strong> detected at{" "}
                  <span className="ddf-escalation-severity">{severityConf?.label}</span> severity.{" "}
                  This can spread rapidly. Expert review recommended.
                </p>
                <EvidenceGraph evidence={result.evidence} />
              </div>
            )}

            {/* Escalation card */}
            <div className="ddf-escalation-card">
              <h3 className="ddf-escalation-card-title">Connect to an Agronomist</h3>
              <p className="ddf-escalation-card-desc">
                Your photo, field history, and satellite data will be sent to your local
                extension officer.
              </p>

              <label className="ddf-consent-label">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="ddf-consent-checkbox"
                />
                I consent to sharing this field&apos;s diagnosis and satellite metrics with
                my local extension network.
              </label>

              <Button
                disabled={!consentGiven}
                style={{ width: "100%" }}
                onClick={async () => {
                  try {
                    const { escalationApi } = await import(
                      "../../escalation-dashboard/api/escalationApi"
                    );
                    await escalationApi.triggerEscalation(
                      fieldId,
                      result.condition_category === "unknown"
                        ? "low_confidence"
                        : "high_severity",
                      "Layer07",
                      {
                        condition: result.condition_name,
                        confidence: result.confidence,
                        severity: result.severity,
                        consentVerified: true,
                      },
                    );
                    onClose();
                  } catch (err) {
                    console.error("Escalation failed:", err);
                  }
                }}
              >
                <PhoneCall size={17} /> Send to Agronomist
              </Button>
            </div>

            <div className="ddf-escalation-footer">
              <Button variant="ghost" style={{ flex: 1 }} onClick={() => setStep("capture")}>
                Retake Photo
              </Button>
              <Button variant="ghost" style={{ flex: 1 }} onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

      </div>
    </Dialog>
  );
}
