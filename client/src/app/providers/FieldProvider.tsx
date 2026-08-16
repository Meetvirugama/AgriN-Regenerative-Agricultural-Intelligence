import React, { createContext, useContext, useEffect, useState } from 'react';
import { cropApi, FieldCropState } from '../../features/crop-context/api/cropApi';

const FIELD_ID_SESSION_KEY = 'agri_active_field_id';

interface FieldContextValue {
  activeFieldId: string | null;
  cropState: FieldCropState | null;
  isLoading: boolean;
  error: string | null;
  refreshCropState: () => Promise<void>;
  setCropState: React.Dispatch<React.SetStateAction<FieldCropState | null>>;
}

const FieldContext = createContext<FieldContextValue>({
  activeFieldId: null,
  cropState: null,
  isLoading: true,
  error: null,
  refreshCropState: async () => {},
  setCropState: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useActiveField = () => useContext(FieldContext);

export const FieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [cropState, setCropState] = useState<FieldCropState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchField = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check sessionStorage first — avoids creating a new field on every refresh
      const cachedFieldId = sessionStorage.getItem(FIELD_ID_SESSION_KEY);

      let fieldId: string;

      if (cachedFieldId) {
        // Use the cached field ID — no new stub-init call needed
        fieldId = cachedFieldId;
      } else {
        // First load — call stub-init (idempotent — returns existing or creates once)
        const { field } = await cropApi.initStub();
        fieldId = field.id;
        sessionStorage.setItem(FIELD_ID_SESSION_KEY, fieldId);
      }

      setActiveFieldId(fieldId);
      const state = await cropApi.fetchCropState(fieldId);
      setCropState(state);
    } catch (err: any) {
      console.error('Initialization failed', err);
      // Clear stale cached ID if initialization fails so we retry cleanly
      sessionStorage.removeItem(FIELD_ID_SESSION_KEY);
      setError('Failed to load field data. Please try again.');
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
    <FieldContext.Provider value={{ activeFieldId, cropState, isLoading, error, refreshCropState, setCropState }}>
      {children}
    </FieldContext.Provider>
  );
};

