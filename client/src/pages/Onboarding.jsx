import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Leaf, MapPin, Calendar } from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Onboarding.css";


export const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [fieldName, setFieldName] = useState("");
  const [cropType, setCropType] = useState("wheat");
  const [sowingDate, setSowingDate] = useState("");

  const handleComplete = async () => {
    if (!fieldName || !sowingDate) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Create the field using the real API
      await cropApi.createField({
        name: fieldName.trim(),
        cropType,
        sowingDate,
      });
      // Navigate to the fields list so the user can see their new field
      navigate("/fields");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to set up field. Please try again.");
      setIsSubmitting(false);
    }
  };


  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Header */}
        <div className="onboarding-header">
          <h1 className="onboarding-title">Welcome to AgriMesh</h1>
          <p className="onboarding-subtitle">
            Let's set up your first field profile.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="onboarding-progress-container">
            <div
              className={`onboarding-progress-bar ${step >= 1 ? "active" : "inactive"}`}
            />
            <div
              className={`onboarding-progress-bar ${step >= 2 ? "active" : "inactive"}`}
            />
          </div>

          {step === 1 && (
            <div className="onboarding-step-content">
              <h2 className="onboarding-step-title">
                <MapPin className="text-[var(--primary)]" /> Field Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="onboarding-label">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. North Plot"
                    className="onboarding-input"
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!fieldName.trim()}
                  className="onboarding-btn-primary"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step-content">
              <h2 className="onboarding-step-title">
                <Leaf className="text-[var(--primary)]" /> Crop Context
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="onboarding-label">
                    Primary Crop
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="onboarding-input"
                  >
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="corn">Corn</option>
                    <option value="cotton">Cotton</option>
                  </select>
                </div>

                <div>
                  <label className="onboarding-label">
                    <Calendar size={14} /> Sowing Date
                  </label>
                  <input
                    type="date"
                    value={sowingDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="onboarding-input"
                  />
                </div>

                {error && (
                  <div style={{ color: "#dc2626", fontSize: "0.875rem", textAlign: "center", marginBottom: "0.5rem" }}>
                    {error}
                  </div>
                )}
                <div className="onboarding-btn-group">
                  <button
                    onClick={() => setStep(1)}
                    className="onboarding-btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!sowingDate || isSubmitting}
                    className="onboarding-btn-primary-flex"
                  >
                    {isSubmitting ? (
                      <span className="onboarding-spinner"></span>
                    ) : (
                      <>
                        Complete Setup <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
