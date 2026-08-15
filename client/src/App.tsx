import React, { useEffect, useState } from 'react';
import { cropApi, FieldCropState } from './features/crop-context/api/cropApi';
import { GrowthStageBanner } from './features/crop-context/components/GrowthStageBanner';
import { StageProgressIndicator } from './features/crop-context/components/StageProgressIndicator';
import { CropPhotoCapture } from './features/crop-context/components/CropPhotoCapture';
import { weatherApi, WeatherData } from './features/weather-intelligence/api/weatherApi';
import { WeatherAlertBanner } from './features/weather-intelligence/components/WeatherAlertBanner';
import { WeatherStrip } from './features/weather-intelligence/components/WeatherStrip';
import { WeatherDetails } from './features/weather-intelligence/components/WeatherDetails';
import { soilApi, SoilProfile } from './features/soil-intelligence/api/soilApi';
import { SoilSummaryCard } from './features/soil-intelligence/components/SoilSummaryCard';
import { SoilUploadFlow } from './features/soil-intelligence/components/SoilUploadFlow';

function App() {
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [cropState, setCropState] = useState<FieldCropState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);
  
  // Layer 03 State
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  // Layer 04 State
  const [soilProfile, setSoilProfile] = useState<SoilProfile | null>(null);
  const [isSoilLoading, setIsSoilLoading] = useState(true);
  const [showSoilUpload, setShowSoilUpload] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { field } = await cropApi.initStub();
        setFieldId(field.id);
        
        // Fetch Layer 02 (Crop)
        const state = await cropApi.fetchCropState(field.id);
        setCropState(state);
      } catch (err: any) {
        console.error("Initialization failed", err);
        setError("Failed to load field data. Please try again.");
      } finally {
        setIsLoading(false);
      }

      // Fetch Layer 03 (Weather) - Non-blocking
      try {
        const { field } = await cropApi.initStub();
        const weather = await weatherApi.getForecast(field.id);
        setWeatherData(weather);
      } catch (err: any) {
        console.error("Weather fetch failed", err);
      } finally {
        setIsWeatherLoading(false);
      }

      // Fetch Layer 04 (Soil) - Non-blocking
      try {
        const { field } = await cropApi.initStub();
        const soil = await soilApi.getSoilProfile(field.id);
        setSoilProfile(soil);
      } catch (err: any) {
        console.error("Soil fetch failed", err);
        // NO_DATA is expected for entirely new users/regions
      } finally {
        setIsSoilLoading(false);
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

        {/* Layer 03 Alert Banner (Top Priority) */}
        {!isWeatherLoading && weatherData && (
          <WeatherAlertBanner flags={weatherData.flags} />
        )}

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

        {/* Layer 03 Weather Context UI */}
        <section className="flex flex-col gap-4 mt-6">
          <WeatherStrip 
            forecasts={weatherData?.forecasts || []} 
            flags={weatherData?.flags || []} 
            isLoading={isWeatherLoading}
            onExpand={() => setShowWeatherDetails(!showWeatherDetails)}
          />
          {showWeatherDetails && weatherData && (
            <WeatherDetails forecasts={weatherData.forecasts} />
          )}
        </section>

        {/* Layer 04 Soil Context UI */}
        <section className="flex flex-col gap-4 mt-6 mb-12">
          <SoilSummaryCard 
            profile={soilProfile} 
            isLoading={isSoilLoading} 
            onUploadClick={() => setShowSoilUpload(true)} 
          />
        </section>

        {/* Modals */}
        {showOverride && (
          <CropPhotoCapture 
            onClose={() => setShowOverride(false)}
            onIdentify={handleIdentify}
            onOverrideConfirm={handleOverrideConfirm}
          />
        )}

        {showSoilUpload && fieldId && (
          <SoilUploadFlow 
            fieldId={fieldId}
            onClose={() => setShowSoilUpload(false)}
            onSave={(profile) => setSoilProfile(profile)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
