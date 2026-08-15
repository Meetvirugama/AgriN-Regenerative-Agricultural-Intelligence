import React from 'react';
import { useCreateField } from '../hooks/useCreateField';
import { WelcomeScreen } from './WelcomeScreen';
import { FarmerProfileForm } from './FarmerProfileForm';
import { LocationPermission } from './LocationPermission';
import { FieldDiscoveryMap } from './FieldDiscoveryMap';
import { BoundaryConfirmationMap } from './BoundaryConfirmationMap';
import { FieldDetailsForm } from './FieldDetailsForm';
import { CropSelector } from './CropSelector';
import { IrrigationSelector } from './IrrigationSelector';
import { ReviewScreen } from './ReviewScreen';
import { FieldCreationSuccess } from './FieldCreationSuccess';

export const FieldOnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { state, setStep, setDiscoveryState, updateFarmer, updateField, nextStep, prevStep } = useCreateField();

  // Progress steps for the indicator (excluding welcome and success)
  const progressSteps = [
    'FARMER_PROFILE',
    'LOCATION_PERMISSION',
    'FIELD_DISCOVERY',
    'FIELD_DETAILS',
    'CROP_DETAILS',
    'REVIEW'
  ];

  const currentProgressIndex = progressSteps.indexOf(state.step);
  const showProgress = currentProgressIndex >= 0;

  const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India default

  const renderStep = () => {
    switch (state.step) {
      case 'WELCOME':
        return (
          <WelcomeScreen
            onContinue={() => nextStep('WELCOME')}
            onVoice={() => alert('Voice feature coming soon!')}
          />
        );
      case 'FARMER_PROFILE':
        return (
          <FarmerProfileForm
            farmer={state.farmer}
            onChange={updateFarmer}
            onContinue={() => nextStep('FARMER_PROFILE')}
          />
        );
      case 'LOCATION_PERMISSION':
        return (
          <LocationPermission
            onAllow={() => {
              // Mock geolocation success
              setDiscoveryState('LOCATION_FOUND');
              nextStep('LOCATION_PERMISSION');
            }}
            onManual={() => {
              setDiscoveryState('IDLE');
              nextStep('LOCATION_PERMISSION');
            }}
          />
        );
      case 'FIELD_DISCOVERY':
        return (
          <FieldDiscoveryMap
            center={defaultCenter} // Mock center
            onYesThisIsMine={() => {
              // Mock auto-detected boundary
              const mockBoundary = [
                { lat: 20.593, lng: 78.962 },
                { lat: 20.594, lng: 78.962 },
                { lat: 20.594, lng: 78.963 },
                { lat: 20.593, lng: 78.963 },
              ];
              updateField({ boundary: mockBoundary, areaHa: 1.24 });
              setStep('BOUNDARY_CONFIRMATION');
            }}
            onDrawField={() => {
              setDiscoveryState('MANUAL_DRAWING');
              setStep('BOUNDARY_CONFIRMATION');
            }}
          />
        );
      case 'BOUNDARY_CONFIRMATION':
        return (
          <BoundaryConfirmationMap
            center={defaultCenter}
            initialBoundary={state.field.boundary || []}
            isDrawingMode={state.discoveryState === 'MANUAL_DRAWING'}
            onConfirm={(boundary, areaHa) => {
              updateField({ boundary, areaHa });
              setStep('FIELD_DETAILS');
            }}
            onEdit={() => setDiscoveryState('MANUAL_DRAWING')}
          />
        );
      case 'FIELD_DETAILS':
        return (
          <FieldDetailsForm
            field={state.field}
            onChange={updateField}
            onContinue={() => nextStep('FIELD_DETAILS')}
          />
        );
      case 'CROP_DETAILS':
        return (
          <CropSelector
            field={state.field}
            onChange={updateField}
            onContinue={() => {
              nextStep('CROP_DETAILS');
            }}
          />
        );
      case 'IRRIGATION_DETAILS':
        return (
          <IrrigationSelector
            field={state.field}
            onChange={updateField}
            onContinue={() => nextStep('IRRIGATION_DETAILS')}
          />
        );
      case 'REVIEW':
        return (
          <ReviewScreen
            farmer={state.farmer}
            field={state.field}
            onBack={() => prevStep('REVIEW')}
            onConfirm={() => {
              // Final API call goes here
              nextStep('REVIEW');
            }}
          />
        );
      case 'SUCCESS':
        return (
          <FieldCreationSuccess
            field={state.field}
            onViewField={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      {state.step !== 'SUCCESS' && (
        <div className="border border-border bg-background mb-6">
          <div className="flex justify-between items-center p-4 border-b border-border uppercase text-sm font-bold text-text-main">
            <div className="flex items-center gap-4">
              {state.step !== 'WELCOME' && (
                <button 
                  onClick={() => prevStep(state.step)} 
                  className="hover:underline"
                >
                  ← BACK
                </button>
              )}
              <span>AGRIMESH {showProgress ? `· LAYER 01` : ''}</span>
            </div>
            {showProgress && (
              <span>
                {(currentProgressIndex + 1).toString().padStart(2, '0')} / {progressSteps.length.toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <div className="p-6">
            {renderStep()}
          </div>
        </div>
      )}
      
      {state.step === 'SUCCESS' && (
        <div className="p-6 border border-border bg-background">
          {renderStep()}
        </div>
      )}
    </div>
  );
};
