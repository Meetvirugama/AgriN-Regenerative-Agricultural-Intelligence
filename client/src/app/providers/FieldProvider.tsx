import React, { createContext, useContext, useEffect, useState } from 'react';
import { cropApi, FieldCropState } from '../../features/crop-context/api/cropApi';

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
      // In a real app we'd fetch the farmer's fields. Here we use the stub.
      const { field } = await cropApi.initStub();
      setActiveFieldId(field.id);
      const state = await cropApi.fetchCropState(field.id);
      setCropState(state);
    } catch (err: any) {
      console.error('Initialization failed', err);
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
