import React from "react";
import { Card } from "./Card";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export const ErrorState = ({
  title = "Unable to load data",
  message,
  onRetry,
}) => (
  <Card className="bg-danger/10 border-danger/30 text-danger flex items-start gap-4 p-6">
    <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
    <div className="flex-1">
      <h4 className="font-bold mb-1">{title}</h4>
      <p className="text-sm opacity-90 leading-relaxed mb-4">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  </Card>
);
