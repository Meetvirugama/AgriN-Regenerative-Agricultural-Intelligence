import React from "react";
import { cn } from "../../lib/cn";

export const Card = ({
  children,
  className,
  padding = "md",
  elevation = "none",
  ...props
}) => {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "border border-neutral rounded-xl",
        elevation === "none" ? "bg-surface" : "bg-surface-raised shadow-md",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
