import React from "react";
import { cn } from "../../lib/cn";
import "./StatusBadge.css";

export const StatusBadge = ({ status, children, className }) => {
  const styles = {
    healthy: "status-badge-healthy",
    neutral: "status-badge-neutral",
    info: "status-badge-info",
    attention: "status-badge-attention",
    urgent: "status-badge-urgent",
  };

  return (
    <span
      className={cn(
        "status-badge",
        styles[status],
        className,
      )}
    >
      {children}
    </span>
  );
};
