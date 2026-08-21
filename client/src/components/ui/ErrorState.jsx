import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export const ErrorState = ({
  title = "Unable to load data",
  message,
  onRetry,
}) => (
  <div className="flex items-start justify-between gap-3 p-3 bg-danger/5 border border-danger/20 rounded-lg text-danger shadow-sm animate-fade-in">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex flex-col">
        <h4 className="font-bold text-sm leading-tight">{title}</h4>
        {message && (
          <p className="text-xs opacity-80 mt-1 leading-relaxed max-w-[80%]">{message}</p>
        )}
      </div>
    </div>
    {onRetry && (
      <Button variant="destructive" size="sm" onClick={onRetry} className="shrink-0 text-xs py-1 px-3 h-auto">
        Retry
      </Button>
    )}
  </div>
);
