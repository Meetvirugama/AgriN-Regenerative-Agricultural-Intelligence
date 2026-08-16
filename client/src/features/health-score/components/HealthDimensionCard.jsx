import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const HealthDimensionCard = ({ title, dimension, icon }) => {
  const [expanded, setExpanded] = useState(false);

  let statusColor = "bg-success";
  if (dimension.severity === "red") statusColor = "bg-danger";
  if (dimension.severity === "amber") statusColor = "bg-warning";

  return (
    <div className="bg-background border border-border flex flex-col">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-text-muted">{icon}</div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {title}
            </h3>
            <p className="font-semibold">{dimension.value}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />
          {expanded ? (
            <ChevronUp size={20} className="text-text-muted" />
          ) : (
            <ChevronDown size={20} className="text-text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-border/50 bg-surface text-sm animate-fade-in">
          <ul className="space-y-2 mt-4 list-disc list-inside">
            {dimension.basis.map((reason, idx) => (
              <li key={idx} className="text-text-main">
                {reason}
              </li>
            ))}
            {dimension.basis.length === 0 && (
              <li className="text-text-muted">
                No specific details available.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
