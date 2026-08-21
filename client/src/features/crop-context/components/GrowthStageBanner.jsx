import React from "react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";
import { PenLine } from "lucide-react";
import "./GrowthStageBanner.css";

export function GrowthStageBanner({ cropState, isLoading, onOverrideClick }) {
  if (isLoading || !cropState) {
    return (
      <div className="gsb-skeleton">
        <div className="gsb-skeleton-line-1"></div>
        <div className="gsb-skeleton-line-2"></div>
      </div>
    );
  }

  const {
    current_stage,
    stage_conflict,
    accumulated_gdd,
    confirmed_crop,
    stage_description,
  } = cropState;

  // GDD / 15 ≈ days since sowing — minimum 1 to avoid showing "Day 0"
  const approxDays = Math.max(1, Math.floor((accumulated_gdd ?? 0) / 15));

  return (
    <div className="gsb-card">
      {/* Background decoration blobs */}
      <div className="gsb-blob-1" aria-hidden="true"></div>
      <div className="gsb-blob-2" aria-hidden="true"></div>

      {stage_conflict && (
        <div className="gsb-conflict-badge">
          <span className="gsb-conflict-ping-wrapper">
            <span className="gsb-conflict-ping"></span>
            <span className="gsb-conflict-dot"></span>
          </span>
          System is verifying this stage
        </div>
      )}

      <div className="gsb-content">
        <div className="gsb-info">
          <div className="gsb-title-row">
            <h2 className="gsb-title">
              Day {approxDays} — {current_stage}
            </h2>
            <TextToSpeechButton
              textToRead={`Day ${approxDays}, ${current_stage || "unknown"} stage. ${confirmed_crop || "unknown crop"}. ${stage_description || ""}`}
              className="gsb-tts-btn"
            />
          </div>
          <p className="gsb-description">
            <span className="gsb-crop-name">{confirmed_crop || "Unknown"}</span>
            <span className="gsb-stage-desc">{stage_description}</span>
          </p>
        </div>

        <button
          onClick={onOverrideClick}
          className="gsb-override-btn"
          aria-label="Update crop or growth stage"
        >
          <PenLine className="gsb-override-btn-icon" />
          Fix Stage
        </button>
      </div>
    </div>
  );
}
