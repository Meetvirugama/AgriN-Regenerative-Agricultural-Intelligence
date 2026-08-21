import React from "react";
import { Check, Leaf, Sprout, Flower2, Wheat } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import "./StageProgressIndicator.css";

const STAGES = [
  { id: "germination", label: "Germination", icon: Sprout },
  { id: "vegetative", label: "Vegetative", icon: Leaf },
  { id: "flowering", label: "Flowering", icon: Flower2 },
  { id: "maturity", label: "Maturity", icon: Wheat },
];

export function StageProgressIndicator({ currentStage }) {
  if (!currentStage) return null;

  const normalizedStage = currentStage.toLowerCase();
  const currentIndex = STAGES.findIndex((s) => s.id === normalizedStage);

  // If the stage from the backend doesn't match any known stage, render nothing
  // rather than showing a broken progress bar.
  if (currentIndex === -1) return null;

  const progressPercent =
    STAGES.length > 1
      ? (currentIndex / (STAGES.length - 1)) * 100
      : 0;

  // Active track width: span from left edge to the center of the current node.
  // For index 0 the track should be 0 width; for the last it should be ~100%.
  const activeTrackWidth =
    currentIndex === 0
      ? "0%"
      : `calc(${progressPercent}% - 2rem)`;

  return (
    <Card className="spi-card">
      <div className="spi-header">
        <h3 className="spi-header-label">Season Progress</h3>
        <div className="spi-percent-badge">
          {progressPercent.toFixed(0)}% Complete
        </div>
      </div>

      <div className="spi-track-container">
        {/* Background track */}
        <div className="spi-track-bg" aria-hidden="true"></div>

        {/* Active progress track */}
        <div
          className="spi-track-active"
          style={{ width: activeTrackWidth }}
          aria-hidden="true"
        ></div>

        {/* Stage nodes */}
        <div className="spi-nodes">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isPending = idx > currentIndex;
            const Icon = stage.icon;

            const boxClass = isCompleted
              ? "spi-node-box-completed"
              : isActive
              ? "spi-node-box-active"
              : "spi-node-box-pending";

            const labelClass = isCompleted
              ? "spi-node-label-completed"
              : isActive
              ? "spi-node-label-active"
              : "spi-node-label-pending";

            return (
              <div key={stage.id} className="spi-node">
                {/* Pulse ring for active node only */}
                {isActive && (
                  <div className="spi-node-pulse" aria-hidden="true" />
                )}

                <div className={`spi-node-box ${boxClass}`}>
                  {isCompleted ? (
                    <Check className="spi-node-icon spi-node-icon-check" />
                  ) : (
                    <Icon className="spi-node-icon" />
                  )}
                </div>

                <div className={`spi-node-label ${labelClass}`}>
                  {stage.label}
                  {isActive && (
                    <span className="spi-node-current-text">Current</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacer to push card bottom below the absolutely-positioned labels */}
      <div className="spi-label-spacer"></div>
    </Card>
  );
}
