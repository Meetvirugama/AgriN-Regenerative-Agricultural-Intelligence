import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveField } from "../app/providers/FieldProvider";

export const Home = () => {
  const { activeFieldId, isLoading } = useActiveField();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && activeFieldId) {
      navigate(`/fields/${activeFieldId}`, { replace: true });
    }
  }, [isLoading, activeFieldId, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-text-muted">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading your fields...</p>
      </div>
    </div>
  );
};
