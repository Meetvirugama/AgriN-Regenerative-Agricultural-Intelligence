import React from "react";
import { cn } from "../../lib/cn";

export const Button = React.forwardRef(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-content hover:bg-text-muted",
      secondary:
        "bg-surface border border-neutral text-text hover:bg-neutral/50",
      ghost:
        "bg-transparent text-text hover:bg-neutral/20 border border-transparent",
      destructive: "bg-danger text-white hover:bg-danger/90",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wide transition-colors",
          "min-h-[44px] min-w-[44px]", // Touch target ≥44px
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
