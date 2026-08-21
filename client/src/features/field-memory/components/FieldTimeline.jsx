import React, { useState } from "react";
import {
  Leaf,
  AlertTriangle,
  CloudRain,
  Sun,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";

import "./FieldTimeline.css";

export const FieldTimeline = ({ entries }) => {
  const [seasonFilter, setSeasonFilter] = useState("This Season");

  const filteredEntries = entries.filter(
    (e) => seasonFilter === "All Time" || e.season_label === seasonFilter,
  );

  const getIconForType = (type) => {
    switch (type) {
      case "advisory":
        return <Leaf size={16} className="field-timeline-icon-success" />;
      case "satellite_anomaly":
        return <AlertTriangle size={16} className="field-timeline-icon-error" />;
      case "weather_event":
        return <CloudRain size={16} className="field-timeline-icon-primary" />;
      case "diagnosis":
        return <Activity size={16} className="field-timeline-icon-warning" />;
      case "farmer_note":
        return <ImageIcon size={16} className="field-timeline-icon-muted" />;
      default:
        return <Sun size={16} className="field-timeline-icon-muted" />;
    }
  };

  return (
    <div className="field-timeline-container">
      <div className="field-timeline-header">
        <h2 className="field-timeline-title">
          Field History
        </h2>
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="field-timeline-filter"
        >
          <option value="This Season">This Season</option>
          <option value="Last Season">Last Season</option>
          <option value="All Time">All Time</option>
        </select>
      </div>

      <div className="field-timeline-list">
        {filteredEntries.length === 0 ? (
          <div className="field-timeline-empty">
            No history found for {seasonFilter.toLowerCase()}.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="field-timeline-item"
            >
              {/* Timeline dot/icon */}
              <div className="field-timeline-icon-wrapper">
                {getIconForType(entry.entry_type)}
              </div>

              {/* Content Card */}
              <div className="field-timeline-card">
                <div className="field-timeline-card-header">
                  <span className="field-timeline-date">
                    {new Date(entry.entry_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <TextToSpeechButton
                    textToRead={entry.summary_text}
                    className="w-6 h-6 p-1 text-text-muted hover:text-text bg-transparent" // text to speech button classes are fine for its internal component logic, but we can replace bg-transparent.
                  />
                </div>
                <p className="field-timeline-summary">
                  {entry.summary_text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
