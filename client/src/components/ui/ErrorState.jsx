import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import "./ErrorState.css";

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
    <div className={`error-state ${compact ? 'error-state-compact' : 'error-state-normal'}`} role="alert">
      <div className="error-state-content">
        <AlertTriangle className="error-state-icon" />
        <div className="error-state-text-container">
          <h4 className="error-state-title">{title}</h4>
          {message && (
            <p className="error-state-message">{message}</p>
          )}
        </div>
      </div>
      {handleAction && (
        <Button variant="destructive" size="sm" onClick={handleAction} className="error-state-btn">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
