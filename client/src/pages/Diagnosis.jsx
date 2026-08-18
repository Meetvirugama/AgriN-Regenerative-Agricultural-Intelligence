import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronRight,
  Upload,
  Download,
  ShieldAlert,
  Maximize2,
  Info,
  Lightbulb,
  ChevronLeft,
  ShieldCheck,
  Leaf,
  Zap,
  CalendarClock,
  UserSquare2,
  Share2,
  ListTodo,
  Loader2,
  ImagePlus,
  Camera,
  ScanSearch,
  Check,
  AlertTriangle,
  PhoneCall,
  HelpCircle,
  CloudRain,
  Satellite,
  Mountain,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  History,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { diagnosisApi } from "../features/disease-diagnosis/api/diagnosisApi";
import "./Diagnosis.css";

/* ─────────────────── CONSTANTS ─────────────────────────────────────────── */
const FARMER_QUESTIONS = [
  { key: "noticed_when",  label: "When did you first notice this?",          placeholder: "e.g. 3 days ago, yesterday..." },
  { key: "is_spreading",  label: "Is the problem spreading?",                 placeholder: "e.g. Yes, spreading fast / No, same area..." },
  { key: "recent_rain",   label: "Has it rained recently?",                   placeholder: "e.g. Yes, heavy rain 2 days ago / No, dry spell..." },
  { key: "recent_spray",  label: "Did you apply fertilizer or pesticide recently?", placeholder: "e.g. Yes, urea 1 week ago / No..." },
  { key: "affected_area", label: "Is this affecting one area or the whole field?", placeholder: "e.g. Only the north corner / Spreading across..." },
];

const CATEGORY_CONFIG = {
  disease:             { label: "Disease",             color: "#ef4444", icon: "🦠" },
  pest:                { label: "Pest Infestation",    color: "#f97316", icon: "🐛" },
  nutrient_deficiency: { label: "Nutrient Deficiency", color: "#eab308", icon: "⚗️" },
  water_stress:        { label: "Water Stress",        color: "#3b82f6", icon: "💧" },
  heat_stress:         { label: "Heat Stress",         color: "#f59e0b", icon: "🌡️" },
  healthy:             { label: "Healthy",             color: "#22c55e", icon: "✅" },
  unknown:             { label: "Unknown – Expert Needed", color: "#6b7280", icon: "❓" },
};

const SEVERITY_CONFIG = {
  low:      { label: "Low",      bg: "rgba(34,197,94,0.15)",   text: "#16a34a" },
  medium:   { label: "Moderate", bg: "rgba(234,179,8,0.15)",   text: "#a16207" },
  high:     { label: "High",     bg: "rgba(249,115,22,0.15)",  text: "#c2410c" },
  critical: { label: "Critical", bg: "rgba(239,68,68,0.15)",   text: "#dc2626" },
  none:     { label: "None",     bg: "rgba(34,197,94,0.15)",   text: "#16a34a" },
  unknown:  { label: "Unknown",  bg: "rgba(107,114,128,0.15)", text: "#6b7280" },
};

const OUTCOME_OPTIONS = [
  { value: "improved",   label: "✅ Improved",  color: "#16a34a" },
  { value: "unchanged",  label: "⚠️ Same",      color: "#a16207" },
  { value: "worsened",   label: "❌ Worsened",  color: "#dc2626" },
  { value: "unknown",    label: "❓ Not Sure",  color: "#6b7280" },
];

const SOURCE_ICON = {
  image:      <Camera size={12} />,
  weather:    <CloudRain size={12} />,
  satellite:  <Satellite size={12} />,
  soil:       <Mountain size={12} />,
  crop_stage: <Leaf size={12} />,
};

/* ─────────────────── HELPERS ────────────────────────────────────────────── */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  const label = pct >= 75 ? "High" : pct >= 50 ? "Medium" : "Low";
  return (
    <div className="dg-confidence-wrapper">
      <div className="dg-confidence-row">
        <span className="dg-muted-label">AI Confidence</span>
        <span style={{ fontWeight: 700, color }}>{pct}% — {label}</span>
      </div>
      <div className="dg-bar-bg">
        <div className="dg-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.unknown;
  return (
    <span className="dg-severity-badge" style={{ background: s.bg, color: s.text }}>
      <ShieldAlert size={11} /> {s.label}
    </span>
  );
}

function EvidenceGraph({ evidence }) {
  const [open, setOpen] = useState(false);
  if (!evidence?.length) return null;
  const supporting = evidence.filter((e) => e.supports_primary);
  const contrary   = evidence.filter((e) => !e.supports_primary);
  return (
    <div className="dg-evidence-box">
      <button className="dg-evidence-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Evidence ({evidence.length} sources)</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="dg-evidence-list">
          {supporting.map((e, i) => (
            <div key={i} className="dg-evidence-item">
              <span className="dg-ev-icon supporting">{SOURCE_ICON[e.source] ?? "•"}</span>
              <span className="dg-ev-text"><strong>{e.source}</strong>: {e.finding}</span>
              <CircleCheck size={12} className="dg-ev-check" />
            </div>
          ))}
          {contrary.map((e, i) => (
            <div key={i} className="dg-evidence-item contrary">
              <span className="dg-ev-icon">{SOURCE_ICON[e.source] ?? "•"}</span>
              <span className="dg-ev-text"><strong>{e.source}</strong>: {e.finding}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DifferentialList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="dg-diff-list">
      <p className="dg-section-label">Differential Diagnosis</p>
      {items.map((item, i) => {
        const pct = Math.round((item.probability ?? 0) * 100);
        const color = i === 0 ? "#22c55e" : i === 1 ? "#eab308" : "#6b7280";
        return (
          <div key={i} className="dg-diff-item">
            <div className="dg-diff-row">
              <span className="dg-diff-name">{item.condition}</span>
              <span style={{ fontWeight: 700, color, fontSize: "0.78rem" }}>{pct}%</span>
            </div>
            <div className="dg-bar-bg" style={{ height: 4 }}>
              <div className="dg-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            {item.rationale && <p className="dg-diff-rationale">{item.rationale}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────── PHOTO SLOT ─────────────────────────────────────────── */
function PhotoSlot({ label, hint, url, onSelect, onClear }) {
  const ref = useRef(null);
  return (
    <div className="dg-photo-slot">
      <p className="dg-photo-slot-label">{label}</p>
      <div
        className={`dg-photo-slot-box ${url ? "has-image" : ""}`}
        onClick={() => !url && ref.current?.click()}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="dg-photo-slot-img" />
            <button className="dg-photo-slot-clear" onClick={(e) => { e.stopPropagation(); onClear(); }}>
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <Camera size={20} className="dg-photo-slot-icon" />
            <span className="dg-photo-slot-hint">{hint}</span>
          </>
        )}
        <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
      </div>
    </div>
  );
}

/* ─────────────────── HISTORY CARD ───────────────────────────────────────── */
function HistoryCard({ obs, fieldId, onFeedbackSaved }) {
  const [open, setOpen] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(obs.outcome ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const cat = CATEGORY_CONFIG[obs.condition_category] ?? CATEGORY_CONFIG.unknown;
  const sev = SEVERITY_CONFIG[obs.severity] ?? SEVERITY_CONFIG.unknown;
  const pct = Math.round((obs.confidence ?? 0) * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  const date = obs.submitted_at ? new Date(obs.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Unknown date";

  const handleFeedback = async () => {
    if (!selectedOutcome) return;
    setSaving(true);
    try {
      await diagnosisApi.submitObservationFeedback(fieldId, obs.id, selectedOutcome, notes);
      setFeedbackMode(false);
      onFeedbackSaved?.();
    } catch (e) {
      console.error("Feedback failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dg-hist-card">
      <div className="dg-hist-header" onClick={() => setOpen((v) => !v)}>
        <div className="dg-hist-left">
          <span className="dg-hist-icon">{cat.icon}</span>
          <div>
            <p className="dg-hist-name">{obs.condition_name}</p>
            <p className="dg-hist-meta">{date} · {obs.crop_type || "Unknown crop"}</p>
          </div>
        </div>
        <div className="dg-hist-right">
          <SeverityBadge severity={obs.severity} />
          <span style={{ fontWeight: 700, color, fontSize: "0.75rem" }}>{pct}%</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {open && (
        <div className="dg-hist-body">
          {obs.what_is_happening && (
            <div className="dg-hist-section">
              <p className="dg-section-label">What is happening?</p>
              <p className="dg-hist-text">{obs.what_is_happening}</p>
            </div>
          )}
          {obs.why_is_it_happening && (
            <div className="dg-hist-section">
              <p className="dg-section-label">Why?</p>
              <p className="dg-hist-text">{obs.why_is_it_happening}</p>
            </div>
          )}
          {obs.treatment_recommendation && (
            <div className="dg-hist-section dg-treatment-box">
              <p className="dg-section-label" style={{ color: "var(--primary)" }}>
                <Check size={11} /> What to do
              </p>
              <p className="dg-hist-text">{obs.treatment_recommendation}</p>
            </div>
          )}
          {obs.action_timing && (
            <div className="dg-hist-section">
              <p className="dg-section-label">When</p>
              <p className="dg-hist-text">{obs.action_timing}</p>
            </div>
          )}
          {obs.monitor && (
            <p className="dg-hist-monitor">📋 <strong>Monitor:</strong> {obs.monitor}</p>
          )}
          <EvidenceGraph evidence={obs.evidence} />
          <DifferentialList items={obs.differential_diagnosis} />

          {/* Outcome feedback */}
          {!feedbackMode ? (
            <div className="dg-hist-outcome-row">
              {obs.outcome && obs.outcome !== "unknown" && (
                <span className="dg-outcome-badge">
                  Outcome: <strong>{obs.outcome}</strong>
                </span>
              )}
              <button className="dg-feedback-btn" onClick={() => setFeedbackMode(true)}>
                <MessageSquare size={13} /> Record Outcome
              </button>
            </div>
          ) : (
            <div className="dg-feedback-form">
              <p className="dg-section-label" style={{ marginBottom: "0.5rem" }}>How did it go after treatment?</p>
              <div className="dg-outcome-grid">
                {OUTCOME_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    className={`dg-outcome-btn ${selectedOutcome === o.value ? "selected" : ""}`}
                    style={selectedOutcome === o.value ? { borderColor: o.color, color: o.color, background: o.color + "18" } : {}}
                    onClick={() => setSelectedOutcome(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <textarea
                className="dg-notes-input"
                placeholder="Any additional notes? (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              <div className="dg-feedback-actions">
                <button className="dg-btn-ghost" onClick={() => setFeedbackMode(false)}>Cancel</button>
                <button className="dg-btn-primary small" onClick={handleFeedback} disabled={!selectedOutcome || saving}>
                  {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── MAIN COMPONENT ─────────────────────────────────────── */
export const Diagnosis = () => {
  // ── Tabs
  const [tab, setTab] = useState("new"); // "new" | "history"

  // ── Fields
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [loadingFields, setLoadingFields] = useState(true);

  // ── Photos
  const [photo1, setPhoto1] = useState(null);   // { file, url }
  const [photo2, setPhoto2] = useState(null);
  const [photo3, setPhoto3] = useState(null);

  // ── Farmer questions
  const [answers, setAnswers] = useState({
    noticed_when: "", is_spreading: "", recent_rain: "", recent_spray: "", affected_area: "",
  });
  const [showQuestions, setShowQuestions] = useState(false);

  // ── Flow
  const [step, setStep] = useState("capture"); // capture | questions | analyzing | result | escalation
  const [result, setResult] = useState(null);
  const [gps, setGps] = useState(null);
  const [error, setError] = useState(null);

  // ── History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Feedback for current result
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const navigate = useNavigate();

  // GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { timeout: 5000, maximumAge: 60000 },
      );
    }
  }, []);

  // Load fields
  useEffect(() => {
    diagnosisApi.getFields().then((data) => {
      const list = Array.isArray(data) ? data : data?.fields ?? [];
      setFields(list);
      if (list.length === 1) setSelectedFieldId(list[0].id);
    }).catch(() => {}).finally(() => setLoadingFields(false));
  }, []);

  // Load history when tab changes or field changes
  const loadHistory = useCallback(async () => {
    if (!selectedFieldId) return;
    setLoadingHistory(true);
    try {
      const obs = await diagnosisApi.getObservations(selectedFieldId, 30);
      setHistory(obs);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedFieldId]);

  useEffect(() => {
    if (tab === "history" && selectedFieldId) loadHistory();
  }, [tab, selectedFieldId, loadHistory]);

  // ── Photo helpers
  const setPhotoSlot = (slot, file) => {
    const url = URL.createObjectURL(file);
    if (slot === 1) setPhoto1({ file, url });
    else if (slot === 2) setPhoto2({ file, url });
    else setPhoto3({ file, url });
  };
  const clearPhotoSlot = (slot) => {
    if (slot === 1) { if (photo1) URL.revokeObjectURL(photo1.url); setPhoto1(null); }
    else if (slot === 2) { if (photo2) URL.revokeObjectURL(photo2.url); setPhoto2(null); }
    else { if (photo3) URL.revokeObjectURL(photo3.url); setPhoto3(null); }
  };

  // ── Analyze
  const handleAnalyze = async () => {
    if (!photo1 || !selectedFieldId) return;
    setStep("analyzing");
    setError(null);
    try {
      const base64_1 = await toBase64(photo1.file);
      const base64_2 = photo2 ? await toBase64(photo2.file) : null;
      const base64_3 = photo3 ? await toBase64(photo3.file) : null;

      const farmerObs = Object.values(answers).some(Boolean) ? answers : null;

      const data = await diagnosisApi.diagnoseCrop(selectedFieldId, base64_1, {
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        image2: base64_2,
        image3: base64_3,
        farmerObservations: farmerObs,
      });

      setResult(data);
      setFeedbackSaved(false);
      setFeedbackMode(false);
      setSelectedOutcome("");
      setOutcomeNotes("");

      if (data.escalation_triggered || data.requires_expert) {
        setStep("escalation");
      } else {
        setStep("result");
      }
    } catch (err) {
      console.error("[Diagnosis]", err);
      setError("Analysis failed. Please try again.");
      setStep("capture");
    }
  };

  // ── Save feedback for current result
  const handleSaveFeedback = async () => {
    if (!selectedOutcome || !result?.id || !selectedFieldId) return;
    setSavingFeedback(true);
    try {
      await diagnosisApi.submitObservationFeedback(selectedFieldId, result.id, selectedOutcome, outcomeNotes);
      setFeedbackSaved(true);
      setFeedbackMode(false);
    } catch (e) {
      console.error("Feedback failed:", e);
    } finally {
      setSavingFeedback(false);
    }
  };

  // ── Reset
  const handleReset = () => {
    setStep("capture");
    setResult(null);
    setPhoto1(null);
    setPhoto2(null);
    setPhoto3(null);
    setAnswers({ noticed_when: "", is_spreading: "", recent_rain: "", recent_spray: "", affected_area: "" });
    setShowQuestions(false);
    setError(null);
  };

  const catConf = result ? (CATEGORY_CONFIG[result.condition_category] ?? CATEGORY_CONFIG.unknown) : null;
  const sevConf = result ? (SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.unknown) : null;

  /* ── RENDER ─────────────────────────────────────────────────────────────── */
  return (
    <div className="dg-page">

      {/* ── PAGE HEADER */}
      <div className="dg-page-header">
        <div>
          <h1 className="dg-page-title">Crop Diagnosis</h1>
          <p className="dg-page-sub">AI-powered disease, pest &amp; stress detection</p>
        </div>
        <div className="dg-tabs">
          <button className={`dg-tab ${tab === "new" ? "active" : ""}`} onClick={() => { setTab("new"); }}>
            <ScanSearch size={15} /> New Diagnosis
          </button>
          <button className={`dg-tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            <History size={15} /> History
          </button>
        </div>
      </div>

      {/* ── FIELD SELECTOR */}
      <div className="dg-field-selector">
        <Leaf size={15} className="dg-field-icon" />
        <span className="dg-field-label">Field:</span>
        {loadingFields ? (
          <Loader2 size={14} className="spin" />
        ) : fields.length === 0 ? (
          <span className="dg-field-empty">No fields yet — <Link to="/fields/add" className="dg-link">add a field</Link></span>
        ) : (
          <select
            className="dg-field-select"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
          >
            <option value="">Select a field…</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.name || f.field_name || f.id}</option>
            ))}
          </select>
        )}
        {gps && (
          <span className="dg-gps-tag">📍 GPS {gps.latitude.toFixed(3)}°, {gps.longitude.toFixed(3)}°</span>
        )}
      </div>

      {/* ── TAB: NEW DIAGNOSIS */}
      {tab === "new" && (
        <div className="dg-content">

          {/* ── CAPTURE STEP */}
          {step === "capture" && (
            <div className="dg-card dg-capture-card">
              <h2 className="dg-card-title"><Camera size={18} /> Photo Capture</h2>
              <p className="dg-card-sub">For best results, upload all 3 photos. At least 1 required.</p>

              <div className="dg-photo-row">
                <PhotoSlot
                  label="① Affected Area"
                  hint="Close-up of symptoms"
                  url={photo1?.url}
                  onSelect={(f) => setPhotoSlot(1, f)}
                  onClear={() => clearPhotoSlot(1)}
                />
                <PhotoSlot
                  label="② Whole Plant"
                  hint="Full plant view"
                  url={photo2?.url}
                  onSelect={(f) => setPhotoSlot(2, f)}
                  onClear={() => clearPhotoSlot(2)}
                />
                <PhotoSlot
                  label="③ Close-up / Underside"
                  hint="Leaf underside or detail"
                  url={photo3?.url}
                  onSelect={(f) => setPhotoSlot(3, f)}
                  onClear={() => clearPhotoSlot(3)}
                />
              </div>

              {error && (
                <div className="dg-error-banner">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              {/* Farmer Questions toggle */}
              {photo1 && (
                <div className="dg-questions-section">
                  <button className="dg-questions-toggle" onClick={() => setShowQuestions((v) => !v)}>
                    <MessageSquare size={14} />
                    {showQuestions ? "Hide" : "Add"} Farmer Observations (optional — improves accuracy)
                    {showQuestions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showQuestions && (
                    <div className="dg-questions-grid">
                      {FARMER_QUESTIONS.map((q) => (
                        <div key={q.key} className="dg-question-item">
                          <label className="dg-q-label">{q.label}</label>
                          <input
                            className="dg-q-input"
                            type="text"
                            placeholder={q.placeholder}
                            value={answers[q.key]}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="dg-capture-actions">
                <button
                  className="dg-btn-primary"
                  disabled={!photo1 || !selectedFieldId}
                  onClick={handleAnalyze}
                >
                  <ScanSearch size={17} /> Analyze with AI
                </button>
                {!selectedFieldId && <p className="dg-hint-text">Please select a field above first</p>}
              </div>
            </div>
          )}

          {/* ── ANALYZING STEP */}
          {step === "analyzing" && (
            <div className="dg-card dg-analyzing-card">
              <Loader2 size={48} className="spin dg-analyzing-spinner" />
              <h2 className="dg-analyzing-title">Analyzing your photo…</h2>
              <div className="dg-analyzing-steps">
                <p>🌿 Reading visual symptoms</p>
                <p>🌧 Checking recent weather data</p>
                <p>🛰 Loading satellite NDVI trend</p>
                <p>🧪 Applying soil &amp; crop context</p>
                <p>🤖 AI reasoning &amp; diagnosis</p>
              </div>
            </div>
          )}

          {/* ── RESULT STEP */}
          {(step === "result" || step === "escalation") && result && (
            <div className="dg-result-layout">

              {/* LEFT — Main result */}
              <div className="dg-result-main">

                {/* Image + Condition Card */}
                <div className="dg-card dg-result-card">
                  {photo1 && (
                    <div className="dg-result-img-wrapper">
                      <img src={photo1.url} alt="Crop" className="dg-result-img" />
                      {photo2 && <img src={photo2.url} alt="Whole plant" className="dg-result-img-thumb" />}
                      {photo3 && <img src={photo3.url} alt="Close-up" className="dg-result-img-thumb" />}
                    </div>
                  )}

                  <div className="dg-result-info">
                    {result.image_quality === "poor" && (
                      <div className="dg-quality-warning">
                        <AlertTriangle size={13} /> Poor image quality detected — consider retaking for higher confidence.
                      </div>
                    )}

                    {step === "escalation" && (
                      <div className="dg-escalation-banner">
                        <AlertTriangle size={14} />
                        {result.condition_category === "unknown" || result.requires_expert
                          ? "Cannot diagnose confidently — expert review recommended."
                          : `High severity ${catConf?.label} detected — expert review recommended.`}
                      </div>
                    )}

                    <div className="dg-condition-header">
                      <span className="dg-condition-icon">{catConf?.icon}</span>
                      <div>
                        <p className="dg-crop-tag">{result.crop_type || "Unknown crop"}</p>
                        <h2 className="dg-condition-name">{result.condition_name}</h2>
                        <div className="dg-badges">
                          <span className="dg-cat-badge" style={{ background: (catConf?.color ?? "#6b7280") + "22", color: catConf?.color ?? "#6b7280" }}>
                            {catConf?.label}
                          </span>
                          <SeverityBadge severity={result.severity} />
                        </div>
                      </div>
                    </div>

                    <ConfidenceBar confidence={result.confidence} />
                    <EvidenceGraph evidence={result.evidence} />
                    <DifferentialList items={result.differential_diagnosis} />
                  </div>
                </div>

                {/* 6 Questions Card */}
                <div className="dg-card dg-six-q-card">
                  <h3 className="dg-card-title"><Info size={16} /> Diagnosis Details</h3>

                  {result.what_is_happening && (
                    <div className="dg-six-q-section">
                      <p className="dg-section-label">What is happening?</p>
                      <p className="dg-six-q-text">{result.what_is_happening}</p>
                    </div>
                  )}
                  {result.why_is_it_happening && (
                    <div className="dg-six-q-section">
                      <p className="dg-section-label">Why is it happening?</p>
                      <p className="dg-six-q-text">{result.why_is_it_happening}</p>
                    </div>
                  )}
                  {result.treatment_recommendation && (
                    <div className="dg-six-q-section dg-treatment-highlight">
                      <p className="dg-section-label" style={{ color: "var(--primary)" }}>
                        <Check size={12} /> What to do
                      </p>
                      <p className="dg-six-q-text">{result.treatment_recommendation}</p>
                    </div>
                  )}
                  {result.action_timing && (
                    <div className="dg-six-q-section">
                      <p className="dg-section-label">When to act</p>
                      <p className="dg-six-q-text">{result.action_timing}</p>
                    </div>
                  )}
                  {result.monitor && (
                    <div className="dg-six-q-section">
                      <p className="dg-section-label">What to monitor</p>
                      <p className="dg-six-q-text dg-monitor-text">📋 {result.monitor}</p>
                    </div>
                  )}
                </div>

                {/* Follow-up feedback */}
                <div className="dg-card dg-feedback-card">
                  <h3 className="dg-card-title"><MessageSquare size={16} /> Record Outcome</h3>
                  {feedbackSaved ? (
                    <div className="dg-feedback-saved">
                      <CircleCheck size={18} style={{ color: "#22c55e" }} /> Outcome saved. Thank you — this helps improve AgriMesh.
                    </div>
                  ) : !feedbackMode ? (
                    <div className="dg-feedback-prompt">
                      <p className="dg-card-sub">After acting on this advice, come back and record what happened. Your feedback trains the model.</p>
                      <button className="dg-btn-outline small" onClick={() => setFeedbackMode(true)}>
                        <MessageSquare size={14} /> Record What Happened
                      </button>
                    </div>
                  ) : (
                    <div className="dg-feedback-form">
                      <p className="dg-section-label" style={{ marginBottom: "0.5rem" }}>How did the crop respond after treatment?</p>
                      <div className="dg-outcome-grid">
                        {OUTCOME_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            className={`dg-outcome-btn ${selectedOutcome === o.value ? "selected" : ""}`}
                            style={selectedOutcome === o.value ? { borderColor: o.color, color: o.color, background: o.color + "18" } : {}}
                            onClick={() => setSelectedOutcome(o.value)}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="dg-notes-input"
                        placeholder="Additional notes (optional)"
                        value={outcomeNotes}
                        onChange={(e) => setOutcomeNotes(e.target.value)}
                        rows={2}
                      />
                      <div className="dg-feedback-actions">
                        <button className="dg-btn-ghost" onClick={() => setFeedbackMode(false)}>Cancel</button>
                        <button className="dg-btn-primary small" disabled={!selectedOutcome || savingFeedback} onClick={handleSaveFeedback}>
                          {savingFeedback ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Save Outcome
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="dg-result-footer">
                  <Info size={14} style={{ color: "var(--info)", flexShrink: 0 }} />
                  <p>This is AI-generated. Consult a local expert for final decisions. &nbsp;
                    <Link to="/ask" className="dg-link">Ask AgriMesh</Link>
                  </p>
                </div>
              </div>

              {/* RIGHT — Sidebar */}
              <div className="dg-result-sidebar">

                {/* Expert escalation card */}
                {(step === "escalation" || result.requires_expert) && (
                  <div className="dg-card dg-escalation-card">
                    <div className="dg-escalation-icon-wrap">
                      <PhoneCall size={22} />
                    </div>
                    <h3 className="dg-card-title">Connect to Agronomist</h3>
                    <p className="dg-card-sub">Your photo, field history, and satellite data will be sent to your local extension officer.</p>
                    <button className="dg-btn-primary" style={{ width: "100%" }} onClick={() => navigate("/ask")}>
                      <PhoneCall size={15} /> Talk to Expert
                    </button>
                  </div>
                )}

                {/* Quick actions */}
                <div className="dg-card">
                  <h3 className="dg-widget-title"><Zap size={16} /> Quick Actions</h3>
                  <div className="dg-actions-list">
                    <button className="dg-action-btn" onClick={() => navigate("/ask")}>
                      <Share2 size={16} className="dg-action-icon" />
                      <span>Share with Expert</span>
                      <ChevronRight size={14} className="dg-action-chevron" />
                    </button>
                    <button className="dg-action-btn" onClick={() => setTab("history")}>
                      <History size={16} className="dg-action-icon" />
                      <span>View Past Diagnoses</span>
                      <ChevronRight size={14} className="dg-action-chevron" />
                    </button>
                    <button className="dg-action-btn" onClick={handleReset}>
                      <RotateCcw size={16} className="dg-action-icon" />
                      <span>New Diagnosis</span>
                      <ChevronRight size={14} className="dg-action-chevron" />
                    </button>
                  </div>
                </div>

                {/* Farmer questions shown (read-only) */}
                {Object.values(answers).some(Boolean) && (
                  <div className="dg-card dg-obs-card">
                    <h3 className="dg-widget-title"><MessageSquare size={16} /> Your Observations</h3>
                    {FARMER_QUESTIONS.filter((q) => answers[q.key]).map((q) => (
                      <div key={q.key} className="dg-obs-item">
                        <p className="dg-obs-q">{q.label}</p>
                        <p className="dg-obs-a">{answers[q.key]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HISTORY */}
      {tab === "history" && (
        <div className="dg-content">
          {!selectedFieldId ? (
            <div className="dg-card dg-empty-card">
              <History size={40} className="dg-empty-icon" />
              <h3>Select a field to see diagnosis history</h3>
              <p>Use the field selector above.</p>
            </div>
          ) : loadingHistory ? (
            <div className="dg-card dg-analyzing-card">
              <Loader2 size={36} className="spin dg-analyzing-spinner" />
              <p>Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="dg-card dg-empty-card">
              <History size={40} className="dg-empty-icon" />
              <h3>No diagnoses yet for this field</h3>
              <p>Run a new diagnosis to get started.</p>
              <button className="dg-btn-primary" onClick={() => setTab("new")}>
                <ScanSearch size={15} /> Start Diagnosis
              </button>
            </div>
          ) : (
            <div className="dg-history-list">
              <div className="dg-history-header">
                <h2 className="dg-card-title"><History size={16} /> Diagnosis History</h2>
                <span className="dg-hist-count">{history.length} record{history.length !== 1 ? "s" : ""}</span>
              </div>
              {history.map((obs) => (
                <HistoryCard
                  key={obs.id}
                  obs={obs}
                  fieldId={selectedFieldId}
                  onFeedbackSaved={loadHistory}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
