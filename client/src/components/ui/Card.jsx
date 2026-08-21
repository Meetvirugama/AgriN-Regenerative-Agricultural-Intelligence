import React from "react";
import { cn } from "../../lib/cn";
import "./Card.css";

export const Card = ({
  children,
  className,
  padding = "md",
  elevation = "none",
  ...props
}) => {
  const paddingClasses = {
    none: "card-padding-none",
    sm: "card-padding-sm",
    md: "card-padding-md",
    lg: "card-padding-lg",
  };

  return (
    <div
      className={cn(
        "card",
        elevation === "none" ? "card-elevation-none" : "card-elevation-raised",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
