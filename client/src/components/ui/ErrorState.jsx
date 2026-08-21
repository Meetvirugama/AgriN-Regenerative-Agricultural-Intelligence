import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export const ErrorState = ({
  title = "Unable to load data",
  message,
  actionLabel = "Retry",
  onAction,
  onRetry, // for backwards compatibility
  compact = false,
}) => {
  const handleAction = onAction || onRetry;

  return (
    <div className={`flex items-start justify-between gap-3 bg-danger/5 border border-danger/20 rounded-xl text-danger shadow-sm animate-fade-in ${compact ? 'p-3' : 'p-4'}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <h4 className="font-bold text-sm leading-tight">{title}</h4>
          {message && (
            <p className="text-xs opacity-80 mt-1.5 leading-relaxed max-w-[90%]">{message}</p>
          )}
        </div>
      </div>
      {handleAction && (
        <Button variant="destructive" size="sm" onClick={handleAction} className="shrink-0 text-xs py-1.5 px-3 h-auto rounded-lg font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
