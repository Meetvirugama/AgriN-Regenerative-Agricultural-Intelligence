import React from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { Dialog } from "../../../components/ui/Dialog";
import "./CropPlanningModal.css";

export function CropPlanningModal({ options, onClose }) {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Next Season Options"
      className="max-w-md"
    >
      <div className="crop-plan-container">
        <p className="crop-plan-subtitle">
          AI-ranked crops for your field based on soil health and climate
          outlook.
        </p>

        <div className="crop-plan-list">
          {options.map((crop, i) => {
            const cardClass =
              crop.suitability_score >= 80
                ? "crop-plan-card-high"
                : crop.suitability_score >= 60
                ? "crop-plan-card-medium"
                : "crop-plan-card-low";

            const badgeClass =
              crop.suitability_score >= 80
                ? "crop-plan-badge-high"
                : crop.suitability_score >= 60
                ? "crop-plan-badge-medium"
                : "crop-plan-badge-low";

            return (
              <div key={i} className={`crop-plan-card ${cardClass}`}>
                <div className="crop-plan-header">
                  <div>
                    <h3 className="crop-plan-title">{crop.crop_type}</h3>
                    {crop.variety && (
                      <p className="crop-plan-variety">
                        {crop.variety}
                      </p>
                    )}
                  </div>
                  <div className={`crop-plan-badge ${badgeClass}`}>
                    {crop.suitability_score}/100 Match
                  </div>
                </div>

                <div className="crop-plan-reasoning">
                  <TrendingUp
                    size={16}
                    className="crop-plan-reasoning-icon"
                  />
                  <p>{crop.reasoning}</p>
                </div>

                {crop.risk_factors && crop.risk_factors.length > 0 && (
                  <div className="crop-plan-risks-container">
                    <h4 className="crop-plan-risks-title">
                      <AlertTriangle size={14} className="crop-plan-warning-icon" /> Risks
                      to Consider
                    </h4>
                    <ul className="crop-plan-risks-list">
                      {crop.risk_factors.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
