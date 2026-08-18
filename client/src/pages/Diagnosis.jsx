import React, { useState, useRef } from "react";
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
  ImagePlus
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Diagnosis.css";

export const Diagnosis = () => {
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'result', 'previous'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState([
    {
      disease: "Leaf Rust (Puccinia triticina)",
      confidence: 85,
      crop: "Wheat",
      date: "12 May 2025, 02:45 PM",
      id: "DIAG-2025-0512-0245",
      imageUrl: "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=800&q=80"
    }
  ]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDiagnose = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Stub: in reality we'd convert file to Base64 or FormData and use selected field ID
      const data = await cropApi.getDiagnosis("field_mock_1", selectedFile);
      const newResult = {
        disease: "Brown Spot (Bipolaris sorokiniana)",
        confidence: 92,
        crop: data.identified_crop || "Wheat",
        date: new Date().toLocaleString(),
        id: `DIAG-${Date.now()}`,
        imageUrl: previewUrl
      };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      setActiveTab('result');
    } catch (err) {
      console.error("Diagnosis failed:", err);
      // Fallback for demo if backend fails
      const newResult = {
        disease: "Brown Spot (Bipolaris sorokiniana)",
        confidence: 88,
        crop: "Wheat",
        date: new Date().toLocaleString(),
        id: `DIAG-${Date.now()}`,
        imageUrl: previewUrl
      };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      setActiveTab('result');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setActiveTab('upload');
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
            onClick={() => { if(result) setActiveTab('result') }}
            disabled={!result}
            style={{ cursor: !result ? 'not-allowed' : 'pointer', opacity: !result ? 0.5 : 1 }}
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

      {activeTab === 'upload' && (
        <div className="diagnosis-big-upload-box slide-in-left">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
          />
          
          <div 
            className="diagnosis-upload-area"
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="diagnosis-preview-image" />
            ) : (
              <div className="diagnosis-upload-prompt">
                <div className="diagnosis-upload-icon-wrapper-large">
                  <ImagePlus size={64} />
                </div>
                <h2 className="diagnosis-upload-title-large">Upload Crop Image</h2>
                <p className="diagnosis-upload-subtitle-large">Click here to select a clear photo of the affected plant leaf or crop area.</p>
              </div>
            )}
          </div>

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
            
            <button 
              className="diagnosis-btn-primary diagnosis-diagnose-btn"
              onClick={handleDiagnose}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : "Diagnose"}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'result' && result && (
        <div className="diagnosis-three-column-grid slide-in-right">
        
        {/* LEFT COLUMN (~20%) */}
        <div className="diagnosis-col-left">
          <div className="diagnosis-image-wrapper">
            <img src={result.imageUrl} alt="Diseased leaf" className="diagnosis-image" />
            <button className="diagnosis-image-action">
              <Maximize2 size={14} /> View Original
            </button>
          </div>
        </div>

        {/* MIDDLE COLUMN (~50%) */}
        <div className="diagnosis-col-middle">
          
          <div className="diagnosis-primary-info">
            <h1 className="diagnosis-disease-name-large">{result.disease}</h1>
            
            <div className={`diagnosis-merged-confidence ${result.confidence >= 80 ? 'high' : result.confidence >= 50 ? 'medium' : 'low'}`}>
              <div className="diagnosis-confidence-header">
                <ShieldAlert size={16} /> 
                <span className="font-semibold">{result.confidence >= 80 ? 'High' : result.confidence >= 50 ? 'Medium' : 'Low'} Confidence</span>
                <span className="diagnosis-confidence-pct">{result.confidence}%</span>
              </div>
              <div className="diagnosis-score-bar-bg">
                <div className="diagnosis-score-bar-fill" style={{ width: `${result.confidence}%` }}></div>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                Field
              </div>
              <span className="diagnosis-meta-value">Unknown Field</span>
            </div>
            <div className="diagnosis-meta-item">
              <div className="diagnosis-meta-label"><CalendarClock size={14} /> Detected On</div>
              <span className="diagnosis-meta-value">{result.date}</span>
            </div>
            <div className="diagnosis-meta-item">
              <div className="diagnosis-meta-label"><ListTodo size={14} /> Analysis ID</div>
              <span className="diagnosis-meta-value">{result.id}</span>
            </div>
          </div>

          <div className="diagnosis-tabs-card compact">
            <div className="diagnosis-tabs">
              <button className="diagnosis-tab active">About the Disease</button>
              <button className="diagnosis-tab inactive">Symptoms</button>
              <button className="diagnosis-tab inactive">Causes</button>
              <button className="diagnosis-tab inactive">Conditions</button>
              <button className="diagnosis-tab inactive">Prevention</button>
            </div>
            <div className="diagnosis-tab-content">
              <p className="diagnosis-about-text">
                Brown spot is a fungal disease that affects leaves, leaf sheaths, and glumes of wheat. It can reduce yield and grain quality if not managed early.
              </p>
              
              <div className="diagnosis-info-3box-row">
                <div className="diagnosis-info-box-compact">
                  <span className="diagnosis-info-label-sm">Affects</span>
                  <span className="diagnosis-info-value-sm">Leaves, Sheath, Glumes</span>
                </div>
                <div className="diagnosis-info-box-compact">
                  <span className="diagnosis-info-label-sm">Spread By</span>
                  <span className="diagnosis-info-value-sm">Fungal spores, Wind</span>
                </div>
                <div className="diagnosis-info-box-compact alert">
                  <span className="diagnosis-info-label-sm">Risk Level</span>
                  <span className="diagnosis-info-value-sm">High (20-30% loss)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="diagnosis-footer-banner compact">
            <Info size={16} className="diagnosis-footer-icon" />
            <span className="diagnosis-footer-desc">AI-generated diagnosis. Consult local experts.</span>
            <Link to="/expert" className="diagnosis-footer-link ml-auto">Expert Support</Link>
          </div>

        </div>

        {/* RIGHT COLUMN (~30%) */}
        <div className="diagnosis-col-right">
          
          <div className="diagnosis-widget compact">
            <div className="diagnosis-widget-header">
              <Zap size={18} className="text-success" />
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
                <ListTodo size={16} className="diagnosis-action-icon dark" /> View Similar Cases
              </button>
            </div>
          </div>

          <div className="diagnosis-widget compact">
            <div className="diagnosis-widget-header">
              <ShieldCheck size={18} className="text-success" />
              <h3 className="diagnosis-widget-title">Recommended Solutions</h3>
            </div>
            <div className="diagnosis-solutions-list compact">
              <div className="diagnosis-solution-item-compact">
                <Leaf size={16} className="text-success shrink-0 mt-1" />
                <div>
                  <h4 className="diagnosis-solution-name-sm">Propiconazole 25% EC</h4>
                  <p className="diagnosis-solution-desc-sm">Fungicide • 1 ml/L water</p>
                </div>
              </div>
              <div className="diagnosis-solution-item-compact">
                <Leaf size={16} className="text-success shrink-0 mt-1" />
                <div>
                  <h4 className="diagnosis-solution-name-sm">Trichoderma viride</h4>
                  <p className="diagnosis-solution-desc-sm">Biocontrol • 4 kg/acre</p>
                </div>
              </div>
              <button className="diagnosis-solution-view-all">View All Solutions</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'previous' && (
        <div className="diagnosis-history-container slide-in-right">
          <h2 className="diagnosis-history-title">Diagnosis History</h2>
          <div className="diagnosis-history-list">
            {history.map((item, idx) => (
              <div key={idx} className="diagnosis-history-card">
                <img src={item.imageUrl} alt={item.disease} className="diagnosis-history-img" />
                <div className="diagnosis-history-details">
                  <h3 className="diagnosis-history-disease">{item.disease}</h3>
                  <div className="diagnosis-history-meta">
                    <span><CalendarClock size={14} className="inline mr-1" /> {item.date}</span>
                    <span><ShieldAlert size={14} className="inline mr-1" /> {item.confidence}% Confidence</span>
                  </div>
                </div>
                <button 
                  className="diagnosis-btn-outline"
                  onClick={() => {
                    setResult(item);
                    setActiveTab('result');
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
