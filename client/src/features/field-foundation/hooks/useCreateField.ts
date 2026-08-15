import { useState } from 'react';
import { OnboardingStep, FieldDiscoveryState, FarmerProfile, FieldData, OnboardingState, LatLng } from '../types/field.types';

const INITIAL_STATE: OnboardingState = {
  step: 'WELCOME',
  discoveryState: 'IDLE',
  farmer: {
    language: 'English',
  },
  field: {},
};

export function useCreateField() {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);

  const setStep = (step: OnboardingStep) => {
    setState((prev) => ({ ...prev, step }));
  };

  const setDiscoveryState = (discoveryState: FieldDiscoveryState) => {
    setState((prev) => ({ ...prev, discoveryState }));
  };

  const updateFarmer = (farmerUpdates: Partial<FarmerProfile>) => {
    setState((prev) => ({
      ...prev,
      farmer: { ...prev.farmer, ...farmerUpdates },
    }));
  };

  const updateField = (fieldUpdates: Partial<FieldData>) => {
    setState((prev) => ({
      ...prev,
      field: { ...prev.field, ...fieldUpdates },
    }));
  };

  const reset = () => setState(INITIAL_STATE);

  // Helper flow functions
  const nextStep = (current: OnboardingStep) => {
    const sequence: OnboardingStep[] = [
      'WELCOME',
      'FARMER_PROFILE',
      'LOCATION_PERMISSION',
      'FIELD_DISCOVERY',
      'BOUNDARY_CONFIRMATION',
      'FIELD_DETAILS',
      'CROP_DETAILS',
      'IRRIGATION_DETAILS',
      'REVIEW',
      'SUCCESS'
    ];
    const currentIndex = sequence.indexOf(current);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      setStep(sequence[currentIndex + 1]);
    }
  };

  const prevStep = (current: OnboardingStep) => {
    const sequence: OnboardingStep[] = [
      'WELCOME',
      'FARMER_PROFILE',
      'LOCATION_PERMISSION',
      'FIELD_DISCOVERY',
      'BOUNDARY_CONFIRMATION',
      'FIELD_DETAILS',
      'CROP_DETAILS',
      'IRRIGATION_DETAILS',
      'REVIEW',
      'SUCCESS'
    ];
    const currentIndex = sequence.indexOf(current);
    if (currentIndex > 0) {
      setStep(sequence[currentIndex - 1]);
    }
  };

  return {
    state,
    setStep,
    setDiscoveryState,
    updateFarmer,
    updateField,
    nextStep,
    prevStep,
    reset,
  };
}
