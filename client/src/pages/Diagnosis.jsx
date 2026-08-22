import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  ShieldAlert, 
  Maximize2, 
  Info,
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
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { diagnosisApi } from "../features/disease-diagnosis/api/diagnosisApi";
import { useActiveField } from "../app/providers/FieldProvider";

import "./Diagnosis.css";

// Inner sub-tabs for the disease info section
const INFO_TABS = ["About the Disease", "Symptoms", "Causes", "Conditions", "Prevention"];

export const Diagnosis = () => {
  const { activeFieldId } = useActiveField();
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'result', 'previous'
  const [activeInfoTab, setActiveInfoTab] = useState(0); // index into INFO_TABS
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeFieldId) {
      diagnosisApi.getObservations(activeFieldId, 50).then(data => {
        const formattedHistory = data.map(obs => ({
          disease: obs.condition_name || "Unknown",
          confidence: obs.confidence ? Math.round(obs.confidence * 100) : null,
          crop: obs.crop_type || "Unknown",
          date: new Date(obs.submitted_at).toLocaleString(),
          id: obs.id,
          imageUrl: obs.image_url || null,

          severity: obs.severity,
          what_is_happening: obs.what_is_happening,
          why_is_it_happening: obs.why_is_it_happening,
          treatment_recommendation: obs.treatment_recommendation,
          differential_diagnosis: typeof obs.differential_diagnosis === 'string'
            ? JSON.parse(obs.differential_diagnosis)
            : obs.differential_diagnosis,
          evidence: typeof obs.evidence === 'string'
            ? JSON.parse(obs.evidence)
            : obs.evidence
        }));
        setHistory(formattedHistory);
      }).catch(err => console.error("Failed to fetch diagnosis history", err));
    }
  }, [activeFieldId]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const handleDiagnose = async () => {
    if (!selectedFile) return;
    if (!activeFieldId) {
      setUploadError("Please add a field first before running a diagnosis.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const data = await diagnosisApi.diagnoseCrop(activeFieldId, base64Image);
      const newResult = {
        disease: data.condition_name || data.disease_name || data.diagnosis || "Unknown",
        confidence: data.confidence ? Math.round(data.confidence * 100) : null,
        crop: data.crop_type || "Unknown",
        date: new Date().toLocaleString(),
        id: data.id || `DIAG-${Date.now()}`,
        imageUrl: previewUrl,
        severity: data.severity,
        what_is_happening: data.what_is_happening,
        why_is_it_happening: data.why_is_it_happening,
        treatment_recommendation: data.treatment_recommendation,
        differential_diagnosis: typeof data.differential_diagnosis === 'string'
          ? JSON.parse(data.differential_diagnosis)
          : data.differential_diagnosis,
        evidence: typeof data.evidence === 'string'
          ? JSON.parse(data.evidence)
          : data.evidence
      };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      setActiveInfoTab(0);
      setActiveTab('result');
    } catch (err) {
      console.error("Diagnosis failed:", err);
      setUploadError(err?.message || "Diagnosis failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setActiveTab('upload');
  };

  // Helper: get info tab content
  const getInfoTabContent = (tab, res) => {
    switch (tab) {
      case 0: // About the Disease
        return (
          <>
            {res.what_is_happening && (
              <p className="diagnosis-about-text">
                <strong>What is happening:</strong> {res.what_is_happening}
              </p>
            )}
            {res.why_is_it_happening && (
              <p className="diagnosis-about-text diagnosis-mt2">
                <strong>Why is it happening:</strong> {res.why_is_it_happening}
              </p>
            )}
            {!res.what_is_happening && !res.why_is_it_happening && (
              <p className="diagnosis-about-text">No description available.</p>
            )}
          </>
        );
      case 1: // Symptoms
        return <p className="diagnosis-about-text">{res.what_is_happening || "Symptom details not available."}</p>;
      case 2: // Causes
        return <p className="diagnosis-about-text">{res.why_is_it_happening || "Cause details not available."}</p>;
      case 3: // Conditions
        return (
          <p className="diagnosis-about-text">
            {res.evidence?.length > 0
              ? res.evidence.map(e => e.source).filter(Boolean).join(" • ")
              : "Condition data not available."}
          </p>
        );
      case 4: // Prevention
        return <p className="diagnosis-about-text">{res.treatment_recommendation || "Prevention details not available."}</p>;
      default:
        return null;
    }
  };

  return (
    <div className="diagnosis-container">

      {/* HEADER ROW */}
      <div className="diagnosis-header-row">
        <div className="diagnosis-tabs-header">
          <button
            className={`diagnosis-header-tab ${activeTab === 'upload' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('upload')}
          >
            Crop Diagnosis
          </button>
          <button
            className={`diagnosis-header-tab ${activeTab === 'result' ? 'active' : 'inactive'}`}
            onClick={() => { if (result) setActiveTab('result'); }}
            disabled={!result}
            aria-disabled={!result}
          >
            Diagnosis Result
          </button>
          <button
            className={`diagnosis-header-tab ${activeTab === 'previous' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('previous')}
          >
            Previous Diagnosis
          </button>
        </div>
      </div>

      {/* ── UPLOAD TAB ── */}
      {activeTab === 'upload' && (
        <div className="diagnosis-big-upload-box slide-in-left">
          <input
            type="file"
            accept="image/*"
            className="diagnosis-hidden-input"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />

          {/* No-field warning */}
          {!activeFieldId && (
            <div className="diagnosis-no-field-banner">
              <AlertCircle size={16} className="diagnosis-no-field-icon" />
              <span>No field selected. <Link to="/fields/add/location" className="diagnosis-no-field-link">Add a field first</Link> to run a diagnosis.</span>
            </div>
          )}

          <div
            className="diagnosis-upload-area"
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && !previewUrl && fileInputRef.current?.click()}
            aria-label="Click to upload crop image"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="diagnosis-preview-image" />
            ) : (
              <div className="diagnosis-upload-prompt">
                <div className="diagnosis-upload-icon-wrapper-large">
                  <ImagePlus size={56} />
                </div>
                <h2 className="diagnosis-upload-title-large">Upload Crop Image</h2>
                <p className="diagnosis-upload-subtitle-large">Click to select a clear photo of the affected plant leaf or crop area.</p>
                <p className="diagnosis-upload-hint">Supports JPG, PNG, WEBP</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="diagnosis-upload-error">
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="diagnosis-upload-footer">
            {previewUrl && (
              <button
                className="diagnosis-btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Change Image
              </button>
            )}
            {previewUrl && (
              <button
                className="diagnosis-btn-outline"
                onClick={resetUpload}
                disabled={isUploading}
              >
                Clear
              </button>
            )}
            <button
              className="diagnosis-btn-primary diagnosis-diagnose-btn"
              onClick={handleDiagnose}
              disabled={!selectedFile || isUploading || !activeFieldId}
            >
              {isUploading
                ? <><Loader2 size={18} className="diagnosis-spin" /> Analyzing...</>
                : "Diagnose"}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT TAB ── */}
      {activeTab === 'result' && result && (() => {
        const isUnsupported = result?.disease?.toLowerCase().includes("unsupported") || result?.disease?.toLowerCase().includes("not a");
        return (
        <div className="diagnosis-three-column-grid slide-in-right">

          {/* LEFT — image */}
          <div className="diagnosis-col-left">
            <div className="diagnosis-image-wrapper">
              {result.imageUrl ? (
                <img src={result.imageUrl} alt="Diseased leaf" className="diagnosis-image" />
              ) : (
                <div className="diagnosis-image-placeholder">
                  <Leaf size={48} />
                  <span>No image</span>
                </div>
              )}
              <button className="diagnosis-image-action">
                <Maximize2 size={14} /> View Original
              </button>
            </div>
          </div>

          {/* MIDDLE — info */}
          <div className="diagnosis-col-middle">
            <div className="diagnosis-primary-info">
              <h1 className="diagnosis-disease-name-large">{result.disease}</h1>

              <div className={`diagnosis-merged-confidence ${result.confidence >= 80 ? 'high' : result.confidence >= 50 ? 'medium' : 'low'}`}>
                <div className="diagnosis-confidence-header">
                  <ShieldAlert size={16} />
                  <span className="diagnosis-semibold">
                    {result.confidence >= 80 ? 'High' : result.confidence >= 50 ? 'Medium' : 'Low'} Confidence
                  </span>
                  <span className="diagnosis-confidence-pct">{result.confidence ?? "—"}%</span>
                </div>
                <div className="diagnosis-score-bar-bg">
                  <div className="diagnosis-score-bar-fill" style={{ width: `${result.confidence ?? 0}%` }} />
                </div>
              </div>
            </div>

            <div className="diagnosis-meta-grid-2x2">
              <div className="diagnosis-meta-item">
                <div className="diagnosis-meta-label"><Leaf size={14} /> Detected In</div>
                <span className="diagnosis-meta-value">{result.crop}</span>
              </div>
              <div className="diagnosis-meta-item">
                <div className="diagnosis-meta-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/>
                  </svg>
                  Field
                </div>
                <span className="diagnosis-meta-value">Active Field</span>
              </div>
              <div className="diagnosis-meta-item">
                <div className="diagnosis-meta-label"><CalendarClock size={14} /> Detected On</div>
                <span className="diagnosis-meta-value">{result.date}</span>
              </div>
              <div className="diagnosis-meta-item">
                <div className="diagnosis-meta-label"><ListTodo size={14} /> Analysis ID</div>
                <span className="diagnosis-meta-value">{String(result.id).slice(0, 12)}…</span>
              </div>
            </div>

            {/* Inner info tabs */}
            {isUnsupported ? (
              <div className="diagnosis-tabs-card compact">
                <div className="diagnosis-tab-content">
                  {getInfoTabContent(0, result)}
                </div>
              </div>
            ) : (
              <div className="diagnosis-tabs-card compact">
                <div className="diagnosis-tabs">
                  {INFO_TABS.map((tab, i) => (
                    <button
                      key={tab}
                      className={`diagnosis-tab ${activeInfoTab === i ? 'active' : 'inactive'}`}
                      onClick={() => setActiveInfoTab(i)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="diagnosis-tab-content">
                  {getInfoTabContent(activeInfoTab, result)}

                  <div className="diagnosis-info-3box-row">
                    <div className="diagnosis-info-box-compact">
                      <span className="diagnosis-info-label-sm">Affects</span>
                      <span className="diagnosis-info-value-sm">{result.crop || "Crop"}</span>
                    </div>
                    <div className="diagnosis-info-box-compact">
                      <span className="diagnosis-info-label-sm">Primary Source</span>
                      <span className="diagnosis-info-value-sm">
                        {result.evidence?.length > 0 ? result.evidence[0].source : "Visual Analysis"}
                      </span>
                    </div>
                    <div className={`diagnosis-info-box-compact ${result.severity === 'high' || result.severity === 'critical' ? 'alert' : ''}`}>
                      <span className="diagnosis-info-label-sm">Risk Level</span>
                      <span className="diagnosis-info-value-sm diagnosis-capitalize">{result.severity || "Unknown"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="diagnosis-footer-banner compact">
              <Info size={16} className="diagnosis-footer-icon" />
              <span className="diagnosis-footer-desc">AI-generated diagnosis. Consult local experts before applying treatment.</span>
              <Link to="/ask" className="diagnosis-footer-link diagnosis-ml-auto">Expert Support →</Link>
            </div>
          </div>

          {/* RIGHT — widgets */}
          <div className="diagnosis-col-right">
            {!isUnsupported && (
              <>
                <div className="diagnosis-widget compact">
                  <div className="diagnosis-widget-header">
                    <Zap size={18} className="diagnosis-icon-success" />
                    <h3 className="diagnosis-widget-title">Quick Actions</h3>
                  </div>
                  <div className="diagnosis-actions-list compact">
                    <button className="diagnosis-action-btn-compact">
                      <CalendarClock size={16} className="diagnosis-action-icon" /> Set Treatment Reminder
                    </button>
                    <button className="diagnosis-action-btn-compact">
                      <UserSquare2 size={16} className="diagnosis-action-icon" /> Schedule Field Visit
                    </button>
                    <button className="diagnosis-action-btn-compact" onClick={() => navigate('/ask')}>
                      <Share2 size={16} className="diagnosis-action-icon" /> Share with Expert
                    </button>
                    <button className="diagnosis-action-btn-compact">
                      <ListTodo size={16} className="diagnosis-action-icon-muted" /> View Similar Cases
                    </button>
                  </div>
                </div>

                <div className="diagnosis-widget compact">
                  <div className="diagnosis-widget-header">
                    <ShieldCheck size={18} className="diagnosis-icon-success" />
                    <h3 className="diagnosis-widget-title">Recommended Solutions</h3>
                  </div>
                  <div className="diagnosis-solutions-list compact">
                    <div className="diagnosis-solution-item-compact">
                      <ShieldCheck size={16} className="diagnosis-icon-success diagnosis-shrink0 diagnosis-mt1" />
                      <div>
                        <h4 className="diagnosis-solution-name-sm">Primary Recommendation</h4>
                        <p className="diagnosis-solution-desc-sm">{result.treatment_recommendation || "Consult local experts."}</p>
                      </div>
                    </div>

                    {result.differential_diagnosis?.length > 0 && (
                      <div className="diagnosis-solution-item-compact">
                        <Info size={16} className="diagnosis-icon-warning diagnosis-shrink0 diagnosis-mt1" />
                        <div>
                          <h4 className="diagnosis-solution-name-sm">Other Possibilities</h4>
                          <p className="diagnosis-solution-desc-sm">
                            {result.differential_diagnosis
                              .map(d => `${d.condition} (${Math.round((d.probability || 0) * 100)}%)`)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <button className="diagnosis-btn-outline diagnosis-new-scan-btn" onClick={resetUpload}>
              + New Scan
            </button>
          </div>

        </div>
        );
      })()}

      {/* ── PREVIOUS DIAGNOSIS TAB ── */}
      {activeTab === 'previous' && (
        <div className="diagnosis-history-container slide-in-right">
          <h2 className="diagnosis-history-title">Diagnosis History</h2>
          <div className="diagnosis-history-list">
            {history.length === 0 ? (
              <div className="diagnosis-history-empty">
                <ShieldCheck size={48} className="diagnosis-history-empty-icon" />
                <h3 className="diagnosis-history-empty-title">No Diagnosis History</h3>
                <p className="diagnosis-history-empty-desc">
                  {activeFieldId
                    ? "You haven't uploaded any crop images for this field yet."
                    : "Add a field to start tracking diagnoses."}
                </p>
                <button
                  className="diagnosis-btn-outline diagnosis-history-empty-btn"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload an Image
                </button>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="diagnosis-history-card">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.disease} className="diagnosis-history-img" />
                  ) : (
                    <div className="diagnosis-history-img-placeholder">
                      <Leaf size={24} />
                    </div>
                  )}
                  <div className="diagnosis-history-details">
                    <h3 className="diagnosis-history-disease">{item.disease}</h3>
                    <div className="diagnosis-history-meta">
                      <span className="diagnosis-history-meta-item">
                        <CalendarClock size={13} /> {item.date}
                      </span>
                      {item.confidence != null && (
                        <span className="diagnosis-history-meta-item">
                          <ShieldAlert size={13} /> {item.confidence}% Confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="diagnosis-btn-outline"
                    onClick={() => {
                      setResult(item);
                      setActiveInfoTab(0);
                      setActiveTab('result');
                    }}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
