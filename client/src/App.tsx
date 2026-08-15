import React, { useEffect, useState } from 'react';
import { cropApi, FieldCropState } from './features/crop-context/api/cropApi';
import { GrowthStageBanner } from './features/crop-context/components/GrowthStageBanner';
import { StageProgressIndicator } from './features/crop-context/components/StageProgressIndicator';
import { CropPhotoCapture } from './features/crop-context/components/CropPhotoCapture';

function App() {
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [cropState, setCropState] = useState<FieldCropState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { field } = await cropApi.initStub();
        setFieldId(field.id);
        const state = await cropApi.fetchCropState(field.id);
        setCropState(state);
      } catch (err: any) {
        console.error("Initialization failed", err);
        setError("Failed to load field data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleIdentify = async (blob: Blob) => {
    if (!fieldId) return;
    return await cropApi.identifyCrop(fieldId, blob);
  };

  const handleOverrideConfirm = async (cropType: string, stage?: string) => {
    if (!fieldId) return;
    setIsLoading(true);
    try {
      const newState = await cropApi.overrideCropState(fieldId, { cropType, stage: stage as any });
      setCropState(newState);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6 mt-8">
        <header className="mb-2">
          <h1 className="text-3xl font-black text-text tracking-tight">AgriMesh</h1>
          <p className="text-text-muted">Field Intelligence Dashboard</p>
        </header>

        {/* Layer 02 Crop Context UI */}
        <section className="flex flex-col gap-6">
          {error ? (
            <div className="bg-error/10 border border-error p-4 rounded-xl text-error text-center font-bold">
              {error}
            </div>
          ) : (
            <>
              <GrowthStageBanner 
                cropState={cropState} 
                isLoading={isLoading} 
                onOverrideClick={() => setShowOverride(true)} 
              />
              
              <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm">
                <h3 className="font-bold mb-6 tracking-wide text-sm text-text-muted uppercase">Season Progress</h3>
                {isLoading ? (
                  <div className="h-16 animate-pulse bg-neutral/20 rounded"></div>
                ) : (
                  <StageProgressIndicator currentStage={cropState?.current_stage} />
                )}
              </div>
            </>
          )}
        </section>

        {showOverride && (
          <CropPhotoCapture 
            onClose={() => setShowOverride(false)}
            onIdentify={handleIdentify}
            onOverrideConfirm={handleOverrideConfirm}
          />
        )}
      </div>
    </div>
  );
}

export default App;
