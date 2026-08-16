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

export const FieldTimeline = ({ entries }) => {
  const [seasonFilter, setSeasonFilter] = useState("This Season");

  const filteredEntries = entries.filter(
    (e) => seasonFilter === "All Time" || e.season_label === seasonFilter,
  );

  const getIconForType = (type) => {
    switch (type) {
      case "advisory":
        return <Leaf size={16} className="text-success" />;
      case "satellite_anomaly":
        return <AlertTriangle size={16} className="text-error" />;
      case "weather_event":
        return <CloudRain size={16} className="text-primary" />;
      case "diagnosis":
        return <Activity size={16} className="text-warning" />;
      case "farmer_note":
        return <ImageIcon size={16} className="text-text-muted" />;
      default:
        return <Sun size={16} className="text-text-muted" />;
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-text">
          Field History
        </h2>
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="bg-transparent text-sm font-bold text-text-muted uppercase tracking-wider focus:outline-none appearance-none cursor-pointer"
        >
          <option value="This Season">This Season</option>
          <option value="Last Season">Last Season</option>
          <option value="All Time">All Time</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center text-text-muted italic py-8 border-2 border-dashed border-neutral/30 rounded-2xl">
            No history found for {seasonFilter.toLowerCase()}.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="relative pl-6 pb-2 before:absolute before:left-[11px] before:top-8 before:bottom-[-8px] before:w-0.5 before:bg-neutral/20 last:before:hidden"
            >
              {/* Timeline dot/icon */}
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface border-2 border-neutral/30 flex items-center justify-center z-10">
                {getIconForType(entry.entry_type)}
              </div>

              {/* Content Card */}
              <div className="bg-surface border border-neutral/40 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ml-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {new Date(entry.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <TextToSpeechButton
                    textToRead={entry.summary_text}
                    className="w-6 h-6 p-1 text-text-muted hover:text-text bg-transparent"
                  />
                </div>
                <p className="font-semibold text-text leading-snug">
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
