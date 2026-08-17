import React, { useState, useRef } from "react";
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

/* ── Category → display config ──────────────────────────────────────────── */
const CATEGORY_CONFIG = {
  disease:            { label: "Disease",            color: "#ef4444", icon: "🦠" },
  pest:               { label: "Pest Infestation",   color: "#f97316", icon: "🐛" },
  nutrient_deficiency:{ label: "Nutrient Deficiency", color: "#eab308", icon: "⚗️" },
  water_stress:       { label: "Water Stress",       color: "#3b82f6", icon: "💧" },
  heat_stress:        { label: "Heat Stress",        color: "#f59e0b", icon: "🌡️" },
  healthy:            { label: "Healthy",            color: "#22c55e", icon: "✅" },
  unknown:            { label: "Unknown — Needs Expert", color: "#6b7280", icon: "❓" },
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
  image:       <Camera size={13} />,
  weather:     <CloudRain size={13} />,
  satellite:   <Satellite size={13} />,
  soil:        <Mountain size={13} />,
  crop_stage:  <Leaf size={13} />,
};

/* ── Confidence bar ──────────────────────────────────────────────────────── */
function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  const label = pct >= 75 ? "High" : pct >= 50 ? "Medium" : "Low";

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
        <span style={{ color: "var(--text-muted)" }}>Confidence</span>
        <span style={{ fontWeight: 700, color }}>{pct}% — {label}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

/* ── Differential diagnosis list ─────────────────────────────────────────── */
function DifferentialList({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
        Differential Diagnosis
      </p>
      {items.map((item, i) => {
        const pct = Math.round((item.probability ?? 0) * 100);
        const color = i === 0 ? "#22c55e" : i === 1 ? "#eab308" : "#6b7280";
        return (
          <div key={i} style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.15rem" }}>
              <span style={{ fontWeight: 600 }}>{item.condition}</span>
              <span style={{ fontWeight: 700, color }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
            </div>
            {item.rationale && (
              <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{item.rationale}</p>
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
    <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1rem" }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ width: "100%", padding: "0.6rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-raised, var(--surface))", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
      >
        Evidence ({evidence.length} sources)
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {supporting.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.78rem" }}>
              <span style={{ color: "#22c55e", marginTop: "0.1rem" }}>{SOURCE_ICON[e.source] ?? "•"}</span>
              <span style={{ color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text)" }}>{e.source}</strong>: {e.finding}
              </span>
              <CircleCheck size={13} style={{ color: "#22c55e", flexShrink: 0, marginLeft: "auto" }} />
            </div>
          ))}
          {contrary.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.78rem", opacity: 0.7 }}>
              <span style={{ color: "#6b7280", marginTop: "0.1rem" }}>{SOURCE_ICON[e.source] ?? "•"}</span>
              <span style={{ color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text)" }}>{e.source}</strong>: {e.finding}
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
  const [step, setStep] = useState("capture");   // capture | analyzing | result | escalation
  const [result, setResult] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [gps, setGps] = useState(null);
  const fileInputRef = useRef(null);

  // Try to get GPS position when component mounts
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { timeout: 5000, maximumAge: 60000 },
      );
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setCapturedImageUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!capturedBlob) return;
    setStep("analyzing");
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(capturedBlob);
      });

      const data = await diagnosisApi.diagnoseCrop(fieldId, base64, gps ?? {});
      setResult(data);

      if (data.escalation_triggered || data.requires_expert) {
        setStep("escalation");
      } else {
        setStep("result");
      }
    } catch (err) {
      console.error("[Diagnosis]", err);
      setStep("capture");
    }
  };

  const categoryConf = result ? (CATEGORY_CONFIG[result.condition_category] ?? CATEGORY_CONFIG.unknown) : null;
  const severityConf = result ? (SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.unknown) : null;

  return (
    <Dialog isOpen onClose={onClose} title="Crop Health Diagnosis" className="max-w-md">
      <div style={{ display: "flex", flexDirection: "column", minHeight: 420 }}>

        {/* ── CAPTURE STEP ──────────────────────────────────────────────── */}
        {step === "capture" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "1.5rem 0" }}>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 200, height: 200, border: "2px dashed var(--primary)", borderRadius: "1rem", marginBottom: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", background: "var(--primary-10, rgba(34,197,94,0.05))", position: "relative" }}
            >
              {capturedImageUrl ? (
                <img src={capturedImageUrl} alt="Captured" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ position: "absolute", top: 8, left: 8, width: 16, height: 16, borderTop: "2.5px solid var(--primary)", borderLeft: "2.5px solid var(--primary)" }} />
                  <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderTop: "2.5px solid var(--primary)", borderRight: "2.5px solid var(--primary)" }} />
                  <div style={{ position: "absolute", bottom: 8, left: 8, width: 16, height: 16, borderBottom: "2.5px solid var(--primary)", borderLeft: "2.5px solid var(--primary)" }} />
                  <div style={{ position: "absolute", bottom: 8, right: 8, width: 16, height: 16, borderBottom: "2.5px solid var(--primary)", borderRight: "2.5px solid var(--primary)" }} />
                  <ImageIcon size={32} style={{ color: "var(--primary)", opacity: 0.4, marginBottom: 8 }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)" }}>Tap to add photo</span>
                </>
              )}
            </div>

            <h3 style={{ fontWeight: 800, fontSize: "1.15rem", marginBottom: "0.35rem", textAlign: "center" }}>Inspect Crop</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "0.5rem" }}>
              {capturedImageUrl ? "Photo selected. Ready to analyze." : "Take a clear close-up of the affected leaf or plant."}
            </p>
            {gps && (
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                📍 GPS: {gps.latitude.toFixed(4)}°, {gps.longitude.toFixed(4)}°
              </p>
            )}

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" style={{ width: "100%" }}>
                <Camera size={18} /> {capturedImageUrl ? "Retake Photo" : "Camera / Gallery"}
              </Button>
              <Button onClick={handleAnalyze} style={{ width: "100%" }} disabled={!capturedBlob}>
                <ScanSearch size={18} /> Analyze with AI
              </Button>
            </div>
          </div>
        )}

        {/* ── ANALYZING STEP ────────────────────────────────────────────── */}
        {step === "analyzing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "3rem 1rem", gap: "1rem" }}>
            <Loader2 size={48} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontWeight: 800, fontSize: "1.15rem", textAlign: "center" }}>Analyzing your photo…</h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <p>🌿 Reading visual symptoms</p>
              <p>🌧 Checking recent weather data</p>
              <p>🛰 Loading satellite NDVI trend</p>
              <p>🧪 Applying soil & crop context</p>
            </div>
          </div>
        )}

        {/* ── RESULT STEP ───────────────────────────────────────────────── */}
        {step === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.875rem" }}>

            {/* Image quality warning */}
            {result.image_quality === "poor" && (
              <div style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "0.6rem", padding: "0.6rem 0.75rem", display: "flex", gap: "0.5rem", fontSize: "0.78rem", color: "#92400e" }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                Poor image quality detected. Upload a closer, brighter photo for higher confidence.
              </div>
            )}

            {/* Condition header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <span style={{ fontSize: "2rem" }}>{categoryConf.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>
                  Crop: <span style={{ color: "var(--text)" }}>{result.crop_type || "Unknown"}</span>
                </p>
                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Likely Condition</p>
                <h2 style={{ fontWeight: 900, fontSize: "1.2rem", lineHeight: 1.2, margin: "0.15rem 0" }}>{result.condition_name}</h2>
                <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 99, background: categoryConf.color + "22", color: categoryConf.color }}>
                  {categoryConf.label}
                </span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: 99, background: severityConf.bg, color: severityConf.text, flexShrink: 0 }}>
                <ShieldAlert size={11} /> {severityConf.label}
              </div>
            </div>

            {/* Confidence bar */}
            <ConfidenceBar confidence={result.confidence} />

            {/* Evidence graph */}
            <EvidenceGraph evidence={result.evidence} />

            {/* Differential */}
            <DifferentialList items={result.differential_diagnosis} />

            {/* What is happening */}
            {result.what_is_happening && (
              <div style={{ marginTop: "0.5rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
                  What is happening?
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{result.what_is_happening}</p>
              </div>
            )}

            {/* Why is it happening */}
            {result.why_is_it_happening && (
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
                  Why?
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{result.why_is_it_happening}</p>
              </div>
            )}

            {/* Treatment */}
            {result.treatment_recommendation && (
              <div style={{ background: "var(--primary-10, rgba(34,197,94,0.07))", border: "1.5px solid var(--primary)", borderRadius: "0.75rem", padding: "0.875rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Check size={13} /> What to do
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{result.treatment_recommendation}</p>
              </div>
            )}

            {/* When to act */}
            {result.action_timing && (
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
                  When
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{result.action_timing}</p>
              </div>
            )}

            {/* Monitor */}
            {result.monitor && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.25rem" }}>
                📋 <span style={{ fontWeight: 700, fontStyle: "normal", color: "var(--text)" }}>Monitor:</span> {result.monitor}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
              <Button onClick={() => setStep("escalation")} variant="secondary" style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}>
                <PhoneCall size={15} /> Talk to Expert
              </Button>
              <Button onClick={onClose} style={{ width: "100%" }}>Done</Button>
            </div>
          </div>
        )}

        {/* ── ESCALATION STEP ───────────────────────────────────────────── */}
        {step === "escalation" && result && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "1rem" }}>

            {result.condition_category === "unknown" || result.requires_expert ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.75rem" }}>
                <div style={{ padding: "1rem", background: "rgba(234,179,8,0.15)", borderRadius: "50%", color: "#d97706" }}>
                  <HelpCircle size={44} />
                </div>
                <h2 style={{ fontWeight: 900, fontSize: "1.2rem" }}>Unable to Diagnose Confidently</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Confidence is too low to make a safe recommendation. Please upload:
                </p>
                <ul style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "left", listStyle: "disc", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
                  <li>A closer photo of the affected leaf</li>
                  <li>The underside of the leaf</li>
                  <li>A photo of the whole plant</li>
                </ul>

                <DifferentialList items={result.differential_diagnosis} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.75rem" }}>
                <div style={{ padding: "1rem", background: "rgba(239,68,68,0.15)", borderRadius: "50%", color: "#dc2626" }}>
                  <AlertTriangle size={44} />
                </div>
                <h2 style={{ fontWeight: 900, fontSize: "1.2rem" }}>High Severity — {categoryConf?.label}</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>{result.condition_name}</strong> detected at{" "}
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>{severityConf?.label}</span> severity.{" "}
                  This can spread rapidly. Expert review recommended.
                </p>
                <EvidenceGraph evidence={result.evidence} />
              </div>
            )}

            {/* Escalation card */}
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "0.875rem", padding: "1rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>Connect to an Agronomist</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.875rem", lineHeight: 1.5 }}>
                Your photo, field history, and satellite data will be sent to your local extension officer.
              </p>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.875rem" }}>
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  style={{ marginTop: "0.15rem", accentColor: "var(--primary)" }}
                />
                I consent to sharing this field's diagnosis and satellite metrics with my local extension network.
              </label>

              <Button
                disabled={!consentGiven}
                style={{ width: "100%" }}
                onClick={async () => {
                  try {
                    const { escalationApi } = await import("../../escalation-dashboard/api/escalationApi");
                    await escalationApi.triggerEscalation(
                      fieldId,
                      result.condition_category === "unknown" ? "low_confidence" : "high_severity",
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

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="ghost" style={{ flex: 1 }} onClick={() => setStep("capture")}>Retake Photo</Button>
              <Button variant="ghost" style={{ flex: 1 }} onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

      </div>
    </Dialog>
  );
}


