import React from "react";
import { Card } from "./Card";

export const EmptyState = ({ icon, title, message, action }) => (
  <Card className="flex flex-col items-center justify-center text-center p-8 border-dashed">
    {icon && <div className="text-neutral mb-4">{icon}</div>}
    <h3 className="text-lg font-bold text-text mb-2 tracking-wide uppercase">
      {title}
    </h3>
    <p className="text-sm text-text-muted mb-6 max-w-sm">{message}</p>
    {action}
  </Card>
);
