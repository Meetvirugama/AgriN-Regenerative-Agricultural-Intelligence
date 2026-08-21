import React from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import "./FieldHealthHero.css";

export const FieldHealthHero = ({ score, loading }) => {
  if (loading) {
    return (
      <div className="health-hero-loading">
        <div className="health-hero-skeleton-title"></div>
        <div className="health-hero-skeleton-text"></div>
      </div>
    );
  }

  if (!score) return null;

  // Synthesis text will come from Layer 09 later, for now we fall back to a basic aggregation
  const category =
    score.category ||
    score.crop_health?.severity ||
    "green";

  let synthesisText = score.synthesis_text;
  if (!synthesisText) {
    if (category === "critical" || category === "red") {
      synthesisText =
        "Action required: Field is showing signs of stress.";
    } else if (category === "poor" || category === "moderate" || category === "amber") {
      synthesisText =
        "Monitor closely: Several risk factors require your attention.";
    } else {
      synthesisText =
        "Your field is in good shape overall. Conditions are stable.";
    }
  }

  // Determine overall hero color based on the category
  let themeClass = "health-hero-success";
  let textThemeClass = "health-hero-success-text";
  let Icon = CheckCircle;

  if (category === "critical" || category === "red") {
    themeClass = "health-hero-danger";
    textThemeClass = "health-hero-danger-text";
    Icon = AlertCircle;
  } else if (category === "poor" || category === "moderate" || category === "amber") {
    themeClass = "health-hero-warning";
    textThemeClass = "health-hero-warning-text";
    Icon = AlertTriangle;
  }

  return (
    <div className={`health-hero-container ${themeClass}`}>
      <div className="health-hero-header">
        <Info size={16} />
        <span className="health-hero-label">
          Field Synthesis
        </span>
      </div>

      <div className="health-hero-content">
        <Icon className={`health-hero-icon ${textThemeClass}`} size={32} />
        <h2 className="health-hero-text">{synthesisText}</h2>
      </div>
    </div>
  );
};
