import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Check, ChevronRight, Leaf, MapPin, Calendar, User, 
  Globe, Award, Sparkles, Sprout, ArrowRight
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";
import { useAuth } from "../app/providers/AuthProvider";

import "./Onboarding.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "bn", label: "বাংলা (Bengali)" },
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const { farmer } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Farmer Details State
  const [name, setName] = useState(farmer?.name || "");
  const [location, setLocation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(farmer?.preferred_language || "en");
  const [farmingExperienceYears, setFarmingExperienceYears] = useState("3");

  // Field Details State
  const [fieldName, setFieldName] = useState("Main Farm Plot");
  const [cropType, setCropType] = useState("wheat");
  const [sowingDate, setSowingDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Initialize name only ONCE on mount so erasing doesn't restore it
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current) {
      if (farmer?.name) {
        setName(farmer.name);
      }
      isInitializedRef.current = true;
    }
  }, [farmer]);

  const saveFarmerProfile = async () => {
    try {
      await cropApi.updateProfile({
        name: name.trim(),
        location: location.trim() || undefined,
        preferredLanguage: preferredLanguage,
        farmingExperienceYears: farmingExperienceYears ? parseInt(farmingExperienceYears, 10) : 1,
      });
    } catch (err) {
      console.warn("Non-fatal profile update error:", err);
    }
  };

  const handleProfileNext = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setStep(2);
  };

  const handleCompleteToDashboard = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await saveFarmerProfile();
      if (fieldName.trim() && sowingDate) {
        await cropApi.createField({
          name: fieldName.trim(),
          cropType,
          sowingDate,
        });
      }
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      navigate("/", { replace: true });
    }
  };

  const handleGoToMapBoundary = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveFarmerProfile();
      const params = new URLSearchParams({
        address: location || "Madhopur, Uttar Pradesh, India",
      });
      navigate(`/fields/add/location?${params.toString()}`);
    } catch (err) {
      console.error(err);
      navigate("/fields/add/location");
    }
  };

  const handleSkip = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="onboarding-page-wrap">
      {/* Background decorations */}
      <div className="onboarding-bg-circle top-left" />
      <div className="onboarding-bg-circle bottom-right" />

      <div className="onboarding-box">
        {/* Header */}
        <div className="onboarding-header-simple">
          <div className="onboarding-top-badge">
            <Sparkles size={13} />
            <span>Profile Setup • Step {step} of 2</span>
          </div>
          <h1 className="onboarding-title-main">Welcome to AgriMesh</h1>
          <p className="onboarding-subtitle-main">
            {step === 1 
              ? "Set up your farmer profile for personalized recommendations" 
              : "Register your first field to unlock satellite & weather data"}
          </p>
        </div>

        {/* Step indicator bar */}
        <div className="onboarding-stepper">
          <div className={`onboarding-step-line ${step >= 1 ? "filled" : ""}`} />
          <div className={`onboarding-step-line ${step >= 2 ? "filled" : ""}`} />
        </div>

        {/* Form Body */}
        <div className="onboarding-body-clean">
          {step === 1 && (
            <form onSubmit={handleProfileNext} className="onboarding-form-fields">
              <div className="onboarding-input-group">
                <label className="onboarding-field-label">
                  Your Full Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="onboarding-clean-input"
                  autoFocus
                  required
                />
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-field-label">
                  <MapPin size={14} className="label-icon" /> Farm Location / District
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Madhopur, Uttar Pradesh"
                  className="onboarding-clean-input"
                />
              </div>

              <div className="onboarding-row-2">
                <div className="onboarding-input-group">
                  <label className="onboarding-field-label">
                    <Globe size={14} className="label-icon" /> Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="onboarding-clean-input select"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="onboarding-input-group">
                  <label className="onboarding-field-label">
                    <Award size={14} className="label-icon" /> Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={farmingExperienceYears}
                    onChange={(e) => setFarmingExperienceYears(e.target.value)}
                    className="onboarding-clean-input"
                    placeholder="Years"
                  />
                </div>
              </div>

              {error && <div className="onboarding-error-box">{error}</div>}

              {/* Action Buttons */}
              <div className="onboarding-footer-actions">
                <button type="button" onClick={handleSkip} className="onboarding-link-skip">
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="onboarding-submit-btn"
                >
                  Continue <ChevronRight size={17} />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCompleteToDashboard} className="onboarding-form-fields">
              <div className="onboarding-input-group">
                <label className="onboarding-field-label">
                  First Field Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g. Main Farm Plot"
                  className="onboarding-clean-input"
                  autoFocus
                  required
                />
              </div>

              <div className="onboarding-row-2">
                <div className="onboarding-input-group">
                  <label className="onboarding-field-label">
                    <Leaf size={14} className="label-icon" /> Primary Crop
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="onboarding-clean-input select"
                  >
                    <option value="wheat">Wheat (गेहूं)</option>
                    <option value="rice">Rice (चावल / धान)</option>
                    <option value="corn">Corn (मक्का)</option>
                    <option value="cotton">Cotton (कपास)</option>
                    <option value="sugarcane">Sugarcane (गन्ना)</option>
                    <option value="mustard">Mustard (सरसों)</option>
                    <option value="soybean">Soybean (सोयाबीन)</option>
                    <option value="potato">Potato (आलू)</option>
                  </select>
                </div>

                <div className="onboarding-input-group">
                  <label className="onboarding-field-label">
                    <Calendar size={14} className="label-icon" /> Sowing Date
                  </label>
                  <input
                    type="date"
                    value={sowingDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="onboarding-clean-input"
                    required
                  />
                </div>
              </div>

              {error && <div className="onboarding-error-box">{error}</div>}

              {/* Action Buttons */}
              <div className="onboarding-footer-actions step-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="onboarding-btn-back"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleGoToMapBoundary}
                  className="onboarding-btn-map"
                  disabled={isSubmitting}
                  title="Open satellite boundary drawer"
                >
                  Draw on Satellite Map →
                </button>
                <button
                  type="submit"
                  disabled={!fieldName.trim() || !sowingDate || isSubmitting}
                  className="onboarding-submit-btn flex-1"
                >
                  {isSubmitting ? (
                    <span className="onboarding-spinner" />
                  ) : (
                    <>
                      Finish <Check size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
