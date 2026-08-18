import React, { createContext, useContext, useEffect, useState } from "react";
import { cropApi } from "../../features/crop-context/api/cropApi";

const FIELD_ID_SESSION_KEY = "agri_active_field_id";

const FieldContext = createContext({
  activeFieldId: null,
  cropState: null,
  isLoading: true,
  error: null,
  refreshCropState: async () => {},
  setCropState: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useActiveField = () => useContext(FieldContext);

export const FieldProvider = ({ children }) => {
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [cropState, setCropState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchField = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cachedFieldId = sessionStorage.getItem(FIELD_ID_SESSION_KEY);

        let fieldId;

      if (cachedFieldId) {
        fieldId = cachedFieldId;
      } else {
        // First load — call stub-init (idempotent)
        try {
          const { field } = await cropApi.initStub();
          // field is null when the farmer has no fields yet — that's OK
          if (!field) {
            setIsLoading(false);
            return;
          }
          fieldId = field.id;
          sessionStorage.setItem(FIELD_ID_SESSION_KEY, fieldId);
        } catch (stubErr) {
          // stub-init failed (network error, missing route, etc.)
          // Don't crash the shell — pages like /fields/add work without an active field.
          console.warn("[FieldProvider] stub-init failed (non-fatal):", stubErr.message);
          setIsLoading(false);
          return;
        }
      }

      setActiveFieldId(fieldId);

      // Fetch crop state — also non-fatal
      try {
        const state = await cropApi.fetchCropState(fieldId);
        setCropState(state);
      } catch (stateErr) {
        console.warn("[FieldProvider] fetchCropState failed (non-fatal):", stateErr.message);
      }
    } catch (err) {
      console.error("[FieldProvider] Initialization failed:", err);
      sessionStorage.removeItem(FIELD_ID_SESSION_KEY);
      // Don't set error — just leave state null so pages still render
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchField();
  }, []);

  const refreshCropState = async () => {
    if (!activeFieldId) return;
    try {
      const state = await cropApi.fetchCropState(activeFieldId);
      setCropState(state);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FieldContext.Provider
      value={{
        activeFieldId,
        cropState,
        isLoading,
        error,
        refreshCropState,
        setCropState,
      }}
    >
      {children}
    </FieldContext.Provider>
  );
};
