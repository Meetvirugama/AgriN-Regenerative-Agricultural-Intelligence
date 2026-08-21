import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import "./HealthDimensionCard.css";

export const HealthDimensionCard = ({ title, dimension, icon }) => {
  const [expanded, setExpanded] = useState(false);

  let statusColor = "dimension-status-success";
  if (dimension?.severity === "red") statusColor = "dimension-status-danger";
  if (dimension?.severity === "amber") statusColor = "dimension-status-warning";

  return (
    <div className="dimension-card-container">
      <div
        className="dimension-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="dimension-card-title-group">
          <div className="dimension-card-icon">{icon}</div>
          <div>
            <h3 className="dimension-card-title">
              {title}
            </h3>
            <p className="dimension-card-value">{dimension?.value ?? dimension?.score ?? "N/A"}</p>
            {dimension?.label && (
              <p className="dimension-card-label">{dimension.label}</p>
            )}
          </div>
        </div>

        <div className="dimension-card-status-group">
          <div className={`dimension-card-status-dot ${statusColor}`} />
          {expanded ? (
            <ChevronUp size={20} className="dimension-card-chevron" />
          ) : (
            <ChevronDown size={20} className="dimension-card-chevron" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="dimension-card-body">
          <ul className="dimension-card-list">
            {dimension?.basis?.map((reason, idx) => (
              <li key={idx} className="dimension-card-list-item">
                {reason}
              </li>
            ))}
            {(!dimension?.basis || dimension.basis.length === 0) && (
              <li className="dimension-card-empty-item">
                No specific details available.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
