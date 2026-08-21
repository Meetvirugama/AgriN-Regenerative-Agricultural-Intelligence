import React from "react";
import { Card } from "./Card";
import { Loader2 } from "lucide-react";
import "./LoadingSkeleton.css";

export const LoadingSkeleton = ({ message = "Loading data..." }) => (
  <Card className="loading-skeleton">
    <Loader2 className="loading-skeleton-icon" />
    {message}
  </Card>
);
