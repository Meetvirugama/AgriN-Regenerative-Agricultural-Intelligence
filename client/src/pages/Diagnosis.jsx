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
  const [result, setResult] = useState({
    disease: "Brown Spot (Bipolaris sorokiniana)",
    confidence: 92,
    crop: "Wheat",
    date: "18 Jun 2025, 10:30 AM",
    id: "DIAG-2025-0618-1030",
    imageUrl: "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=800&q=80"
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Stub: in reality we'd convert file to Base64 or FormData and use selected field ID
      const data = await cropApi.getDiagnosis("field_mock_1", file);
      setResult({
        disease: "Brown Spot (Bipolaris sorokiniana)",
        confidence: 92,
        crop: data.identified_crop || "Wheat",
        date: new Date().toLocaleString(),
        id: `DIAG-${Date.now()}`,
        imageUrl: URL.createObjectURL(file)
      });
    } catch (err) {
      console.error("Diagnosis failed:", err);
      // Fallback for demo if backend fails
      setResult({
        disease: "Brown Spot (Bipolaris sorokiniana)",
        confidence: 88,
        crop: "Wheat",
        date: new Date().toLocaleString(),
        id: `DIAG-${Date.now()}`,
        imageUrl: URL.createObjectURL(file)
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!result) {
    return (
      <div className="diagnosis-empty-container">
        <div className="diagnosis-upload-card">
          <div className="diagnosis-upload-icon-wrapper">
            {isUploading ? <Loader2 size={36} className="animate-spin" /> : <ImagePlus size={36} />}
          </div>
          <h2 className="diagnosis-upload-title">Upload Crop Image</h2>
          <p className="diagnosis-upload-subtitle">Take a clear photo of the affected plant leaf or crop area for AI diagnosis.</p>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="diagnosis-upload-btn"
          >
            {isUploading ? "Analyzing Image..." : "Select Image from Device"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="diagnosis-container">
      
      {/* HEADER */}
      <div className="diagnosis-header">
        <div>
          <div className="diagnosis-breadcrumb">
            <span className="diagnosis-breadcrumb-link">Crop Diagnosis</span>
            <ChevronRight size={14} />
            <span className="diagnosis-breadcrumb-active">Diagnosis Result</span>
          </div>
          <h1 className="diagnosis-title">Diagnosis Result</h1>
          <p className="diagnosis-subtitle">Analysis completed on 18 Jun 2025, 10:30 AM</p>
        </div>
        <div className="diagnosis-header-actions">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="diagnosis-btn-outline">
            <Upload size={16} /> Upload New Image
          </button>
          <button className="diagnosis-btn-primary">
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      <div className="diagnosis-content">
        
        {/* Main Content (Left) */}
        <div className="diagnosis-main">
          
          {/* Top Result Card */}
          <div className="diagnosis-result-card">
            
            <div className="diagnosis-image-wrapper">
              <img src={result.imageUrl} alt="Diseased leaf" className="diagnosis-image" />
              <button className="diagnosis-image-action">
                <Maximize2 size={14} /> View Original
              </button>
            </div>

            <div className="diagnosis-info">
              <div className="diagnosis-confidence-badge">
                <ShieldAlert size={14} /> High Confidence ({result.confidence}%)
              </div>
              
              <h2 className="diagnosis-disease-name">{result.disease}</h2>
              
              <div className="diagnosis-meta-grid">
                <div className="diagnosis-meta-item">
                  <div className="diagnosis-meta-label">
                    <Leaf size={16} /> Detected In
                  </div>
                  <span className="diagnosis-meta-value">{result.crop}</span>
                </div>
                
                <div className="diagnosis-meta-item">
                  <div className="diagnosis-meta-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                    Field
                  </div>
                  <span className="diagnosis-meta-value">Unknown Field</span>
                </div>
                
                <div className="diagnosis-meta-item">
                  <div className="diagnosis-meta-label">
                    <CalendarClock size={16} /> Detected On
                  </div>
                  <span className="diagnosis-meta-value">{result.date}</span>
                </div>
                
                <div className="diagnosis-meta-item">
                  <div className="diagnosis-meta-label">
                    <ListTodo size={16} /> Analysis ID
                  </div>
                  <span className="diagnosis-meta-value">{result.id}</span>
                </div>
              </div>

              <div className="diagnosis-score-section">
                <div className="diagnosis-score-label">
                  AI Confidence Score <Info size={14} />
                </div>
                <div className="diagnosis-score-bar-bg">
                  <div className="diagnosis-score-bar-fill" style={{ width: `${result.confidence}%` }}></div>
                </div>
                <span className="diagnosis-score-value">{result.confidence}%</span>
              </div>

            </div>
          </div>

          {/* Details Tabs Card */}
          <div className="diagnosis-tabs-card">
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

              <div className="diagnosis-disease-info-grid">
                <div className="diagnosis-info-box">
                  <h4 className="diagnosis-info-label">Affects</h4>
                  <p className="diagnosis-info-value">Leaves, Leaf Sheath,<br/>Glumes</p>
                </div>
                <div className="diagnosis-info-box">
                  <h4 className="diagnosis-info-label">Spread By</h4>
                  <p className="diagnosis-info-value">Fungal spores, Wind,<br/>Crop residue</p>
                </div>
                <div className="diagnosis-info-box">
                  <div className="diagnosis-info-label-group">
                    <h4 className="diagnosis-info-label" style={{marginBottom: 0}}>Risk Level</h4>
                    <span className="diagnosis-risk-badge">High</span>
                  </div>
                  <p className="diagnosis-info-value">Can cause up to<br/>20-30% yield loss</p>
                </div>
              </div>

              <div className="diagnosis-tip-banner">
                <Lightbulb size={20} className="shrink-0" />
                <p className="diagnosis-tip-text">Early detection and proper management can significantly reduce crop damage.</p>
              </div>
            </div>
          </div>

          {/* Similar Cases Card */}
          <div className="diagnosis-similar-card">
            <div className="diagnosis-similar-header">
              <h3 className="diagnosis-similar-title">Similar Cases in Your Area</h3>
              <button className="diagnosis-similar-view-all">View All</button>
            </div>

            <div className="diagnosis-carousel-container">
              <button className="diagnosis-carousel-btn left">
                <ChevronLeft size={16} />
              </button>
              
              <div className="diagnosis-carousel-track">
                <div className="diagnosis-carousel-inner">
                  {/* Case 1 */}
                  <div className="diagnosis-case-item">
                    <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=100&q=80" alt="Wheat" className="diagnosis-case-img" />
                    <div className="diagnosis-case-info">
                      <h4 className="diagnosis-case-title">Brown Spot in Wheat</h4>
                      <p className="diagnosis-case-field">Wheat Field 02</p>
                      <p className="diagnosis-case-meta">Madhopur, UP</p>
                      <p className="diagnosis-case-meta">17 Jun 2025</p>
                    </div>
                    <span className="diagnosis-case-status">Resolved</span>
                  </div>

                  {/* Case 2 */}
                  <div className="diagnosis-case-item">
                    <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=100&q=80" alt="Wheat" className="diagnosis-case-img" />
                    <div className="diagnosis-case-info">
                      <h4 className="diagnosis-case-title">Brown Spot in Wheat</h4>
                      <p className="diagnosis-case-field">Wheat Field 03</p>
                      <p className="diagnosis-case-meta">Madhopur, UP</p>
                      <p className="diagnosis-case-meta">16 Jun 2025</p>
                    </div>
                    <span className="diagnosis-case-status">Resolved</span>
                  </div>

                  {/* Case 3 */}
                  <div className="diagnosis-case-item hidden-lg">
                    <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=100&q=80" alt="Wheat" className="diagnosis-case-img" />
                    <div className="diagnosis-case-info">
                      <h4 className="diagnosis-case-title">Brown Spot in Wheat</h4>
                      <p className="diagnosis-case-field">Wheat Field 05</p>
                      <p className="diagnosis-case-meta">Madhopur, UP</p>
                      <p className="diagnosis-case-meta">15 Jun 2025</p>
                    </div>
                    <span className="diagnosis-case-status">Resolved</span>
                  </div>
                </div>
              </div>

              <button className="diagnosis-carousel-btn right">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Footer Banner */}
          <div className="diagnosis-footer-banner">
            <div className="diagnosis-footer-text">
              <Info size={18} className="diagnosis-footer-icon" />
              <p className="diagnosis-footer-desc">This diagnosis is AI-generated. Please consult local agricultural experts for final decision.</p>
            </div>
            <div className="diagnosis-footer-link-group">
              Need help? Contact <Link to="/ask" className="diagnosis-footer-link">Ask AgriMesh</Link>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="diagnosis-sidebar">
          
          {/* Recommended Solutions */}
          <div className="diagnosis-widget">
            <div className="diagnosis-widget-header">
              <ShieldCheck size={20} className="text-success" />
              <h3 className="diagnosis-widget-title">Recommended Solutions</h3>
            </div>

            <div className="diagnosis-solutions-list">
              
              <div className="diagnosis-solution-item">
                <div className="diagnosis-solution-content">
                  <p className="diagnosis-solution-label">Fungicide Recommendation</p>
                  <div className="diagnosis-solution-row">
                    <div className="diagnosis-solution-info">
                      <div className="diagnosis-solution-icon">
                        <Leaf size={14} />
                      </div>
                      <div>
                        <h4 className="diagnosis-solution-name">Propiconazole 25% EC</h4>
                        <p className="diagnosis-solution-dose">Dose: 1 ml per liter of water</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="diagnosis-solution-chevron" />
                  </div>
                </div>
              </div>

              <div className="diagnosis-solution-item">
                <div className="diagnosis-solution-content">
                  <p className="diagnosis-solution-label">Alternative Options</p>
                  <div className="diagnosis-solution-row">
                    <div className="diagnosis-solution-info">
                      <div className="diagnosis-solution-icon">
                        <Leaf size={14} />
                      </div>
                      <div>
                        <h4 className="diagnosis-solution-name">Tebuconazole 25.9% EC</h4>
                        <p className="diagnosis-solution-dose">Dose: 1 ml per liter of water</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="diagnosis-solution-chevron" />
                  </div>
                </div>
              </div>

              <div className="diagnosis-solution-item">
                <div className="diagnosis-solution-content">
                  <p className="diagnosis-solution-label">Organic / Biocontrol</p>
                  <div className="diagnosis-solution-row">
                    <div className="diagnosis-solution-info">
                      <div className="diagnosis-solution-icon">
                        <Leaf size={14} />
                      </div>
                      <div>
                        <h4 className="diagnosis-solution-name">Trichoderma viride</h4>
                        <p className="diagnosis-solution-dose">Dose: 4 kg per acre</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="diagnosis-solution-chevron" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="diagnosis-widget">
            <div className="diagnosis-widget-header">
              <Zap size={20} className="text-success" />
              <h3 className="diagnosis-widget-title">Quick Actions</h3>
            </div>

            <div className="diagnosis-actions-list">
              <button className="diagnosis-action-btn">
                <div className="diagnosis-action-content">
                  <CalendarClock size={18} className="diagnosis-action-icon" />
                  <span className="diagnosis-action-text">Set Treatment Reminder</span>
                </div>
                <ChevronRight size={16} className="diagnosis-action-chevron" />
              </button>

              <button className="diagnosis-action-btn">
                <div className="diagnosis-action-content">
                  <UserSquare2 size={18} className="diagnosis-action-icon" />
                  <span className="diagnosis-action-text">Schedule Field Visit</span>
                </div>
                <ChevronRight size={16} className="diagnosis-action-chevron" />
              </button>

              <button className="diagnosis-action-btn" onClick={() => navigate('/ask')}>
                <div className="diagnosis-action-content">
                  <Share2 size={18} className="diagnosis-action-icon" />
                  <span className="diagnosis-action-text">Share with Expert</span>
                </div>
                <ChevronRight size={16} className="diagnosis-action-chevron" />
              </button>

              <button className="diagnosis-action-btn">
                <div className="diagnosis-action-content">
                  <ListTodo size={18} className="diagnosis-action-icon dark" />
                  <span className="diagnosis-action-text">View Similar Cases</span>
                </div>
                <ChevronRight size={16} className="diagnosis-action-chevron" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
