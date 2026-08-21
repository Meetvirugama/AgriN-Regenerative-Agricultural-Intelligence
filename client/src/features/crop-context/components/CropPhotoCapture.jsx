import React, { useState } from "react";
import { Camera, Check, Search, AlertCircle } from "lucide-react";
import { Dialog } from "../../../components/ui/Dialog";
import "./CropPhotoCapture.css";

export function CropPhotoCapture({ onClose, onIdentify, onOverrideConfirm }) {
  const [step, setStep] = useState("upload");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualCrop, setManualCrop] = useState("wheat");
  const [manualStage, setManualStage] = useState("vegetative");

  const handleSimulateCapture = async () => {
    setStep("analyzing");
    setError(null);
    try {
      // Simulate a mock blob — in production this would come from a camera/file input
      const blob = new Blob(["mock"], { type: "image/jpeg" });
      const analysis = await onIdentify(blob);
      setResult(analysis);
      setStep("result");
    } catch (err) {
      console.error("[CropPhotoCapture] Identification failed:", err);
      setError(err?.message || "Image identification failed. Please try manually.");
      setStep("manual"); // Graceful fallback to manual entry
    }
  };

  const handleConfirmResult = async () => {
    if (!result?.crop) return;
    // Only update crop type; leave stage for backend to recompute from GDD
    await onOverrideConfirm(result.crop);
    onClose();
  };

  const handleManualSubmit = async () => {
    await onOverrideConfirm(manualCrop, manualStage);
    onClose();
  };

  // Derive confidence dot states: 1 dot = low, 2 = moderate, 3 = high
  const confidenceLevels = { low: 1, moderate: 2, high: 3 };
  const filledDots = result ? (confidenceLevels[result.confidence] ?? 1) : 0;

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Update Crop Information"
      className="max-w-md"
    >
      <div className="cpc-content">
        {/* ── Step: upload ── */}
        {step === "upload" && (
          <div className="cpc-upload-step">
            <button
              type="button"
              onClick={handleSimulateCapture}
              className="cpc-camera-btn"
              aria-label="Capture crop photo for AI identification"
            >
              <Camera size={40} />
            </button>
            <div className="cpc-upload-text">
              <p className="cpc-upload-title">Take a photo of your crop</p>
              <p className="cpc-upload-subtitle">
                Our AI will identify the crop and growth stage
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("manual")}
              className="cpc-manual-link"
            >
              Enter manually instead
            </button>
          </div>
        )}

        {/* ── Step: analyzing ── */}
        {step === "analyzing" && (
          <div className="cpc-analyzing-step">
            <Search size={48} className="cpc-analyzing-icon" />
            <p className="cpc-analyzing-text">Analyzing image...</p>
          </div>
        )}

        {/* ── Step: result ── */}
        {step === "result" && result && (
          <div>
            <div className="cpc-result-box">
              <Check size={28} className="cpc-result-check-icon" />
              <div>
                <h4 className="cpc-result-crop-name">
                  {result.crop}
                  {result.variety ? ` • ${result.variety}` : ""}
                </h4>
                <div className="cpc-confidence-row">
                  <div className="cpc-confidence-dots">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`cpc-confidence-dot ${
                          n <= filledDots
                            ? "cpc-confidence-dot-filled"
                            : "cpc-confidence-dot-empty"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="cpc-confidence-label">
                    {result.confidence} Match
                  </span>
                </div>
              </div>
            </div>

            <div className="cpc-result-actions">
              <button
                type="button"
                onClick={handleConfirmResult}
                className="cpc-btn-primary"
              >
                Yes, this is correct
              </button>
              <button
                type="button"
                onClick={() => setStep("manual")}
                className="cpc-btn-outline"
              >
                No, let me fix it
              </button>
            </div>
          </div>
        )}

        {/* ── Step: manual ── */}
        {step === "manual" && (
          <div className="cpc-manual-step">
            {error && (
              <div className="cpc-warning-banner">
                <AlertCircle size={20} className="cpc-warning-icon" />
                <p className="cpc-warning-text">{error}</p>
              </div>
            )}

            {!error && (
              <div className="cpc-warning-banner">
                <AlertCircle size={20} className="cpc-warning-icon" />
                <p className="cpc-warning-text">
                  Manually setting your crop will reset the automated growth
                  stage tracking.
                </p>
              </div>
            )}

            <div className="cpc-field-group">
              <label htmlFor="manual-crop-select" className="cpc-field-label">
                Crop Type
              </label>
              <select
                id="manual-crop-select"
                className="cpc-select"
                value={manualCrop}
                onChange={(e) => setManualCrop(e.target.value)}
              >
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="maize">Maize</option>
                <option value="cotton">Cotton</option>
              </select>
            </div>

            <div className="cpc-field-group">
              <label htmlFor="manual-stage-select" className="cpc-field-label">
                Current Growth Stage
              </label>
              <select
                id="manual-stage-select"
                className="cpc-select"
                value={manualStage}
                onChange={(e) => setManualStage(e.target.value)}
              >
                <option value="germination">Germination (Just Sprouted)</option>
                <option value="vegetative">Vegetative (Growing Leaves)</option>
                <option value="flowering">Flowering / Heading</option>
                <option value="maturity">Maturity (Ready for Harvest)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleManualSubmit}
              className="cpc-btn-primary cpc-btn-save"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
