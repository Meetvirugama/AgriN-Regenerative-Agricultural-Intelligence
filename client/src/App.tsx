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
import { SatelliteHealthCard, SatelliteDetailView, useSatelliteHealth } from './features/satellite-health';
import { ClimateRiskWidget } from './features/climate-risk/components/ClimateRiskWidget';
import { AdvisoryCard } from './features/agro-advisory/components/AdvisoryCard';
import { LanguageSwitcher } from './features/voice/components/LanguageSwitcher';
import { GlobalMicButton } from './features/voice/components/GlobalMicButton';
import { memoryApi } from './features/field-memory/api/memoryApi';
import { PendingPrompt, FieldTimelineEntry } from './features/field-memory/types';
import { FeedbackPrompt } from './features/field-memory/components/FeedbackPrompt';
import { FieldTimeline } from './features/field-memory/components/FieldTimeline';

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

  // Layer 12 State
  const [pendingPrompts, setPendingPrompts] = useState<PendingPrompt[]>([]);
  const [timeline, setTimeline] = useState<FieldTimelineEntry[]>([]);

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
      
      // Fetch Layer 12 (Field Memory) - Non-blocking
      try {
        const { field } = await cropApi.initStub();
        const prompts = await memoryApi.getPendingPrompts(field.id);
        setPendingPrompts(prompts);
        const tl = await memoryApi.getTimeline(field.id);
        setTimeline(tl);
      } catch (err: any) {
        console.error("Field memory fetch failed", err);
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
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex justify-center p-4">
      <GlobalMicButton />
      <div className="w-full max-w-md flex flex-col gap-6 mt-8">
        <header className="mb-2 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-text tracking-tight">AgriMesh</h1>
            <p className="text-text-muted">Field Intelligence Dashboard</p>
          </div>
          <LanguageSwitcher />
        </header>

        {/* Layer 12 Feedback Prompt */}
        {pendingPrompts.length > 0 && (
          <FeedbackPrompt 
            prompt={pendingPrompts[0]} 
            onDismiss={() => setPendingPrompts(prev => prev.slice(1))} 
          />
        )}

        {/* Layer 03 Alert Banner (Top Priority) */}
        {!isWeatherLoading && weatherData && (
          <WeatherAlertBanner flags={weatherData.flags} />
        )}

        {/* Layer 09 AI Agro-Advisory */}
        <section className="flex flex-col gap-2 mt-2 mb-4">
          <AdvisoryCard fieldId={fieldId || 'mock-field-123'} />
        </section>

        {/* Layer 08 Climate Risk Widget */}
        <section className="flex flex-col gap-2 mt-2">
          <h2 className="font-bold tracking-wide text-sm text-text-muted uppercase">Climate Risk</h2>
          <ClimateRiskWidget fieldId={fieldId || 'mock-field-123'} />
        </section>

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
        <section className="flex flex-col gap-4 mt-6">
          <SoilSummaryCard 
            profile={soilProfile} 
            isLoading={isSoilLoading} 
            onUploadClick={() => setShowSoilUpload(true)} 
          />
        </section>

        {/* Layer 05 Satellite Context UI */}
        <section className="flex flex-col gap-4 mt-6">
          {fieldId && <FieldSatelliteWrapper fieldId={fieldId} />}
        </section>

        {/* Layer 12 Field Timeline */}
        <section className="mt-8 mb-12 border-t-2 border-neutral/30 pt-4">
          <FieldTimeline entries={timeline} />
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

// Wrapper to handle data fetching for the card and modal state
const FieldSatelliteWrapper = ({ fieldId }: { fieldId: string }) => {
  const [showDetail, setShowDetail] = useState(false);
  const { data, loading, error } = useSatelliteHealth(fieldId);
  
  if (error) {
    return <div className="border border-danger p-4 text-danger text-sm">Failed to load satellite data.</div>;
  }
  
  return (
    <>
      <SatelliteHealthCard 
        data={data} 
        loading={loading} 
        onClick={() => setShowDetail(true)} 
      />
      {showDetail && (
        <SatelliteDetailView 
          fieldId={fieldId} 
          fieldBoundary={[
            { lat: 20.593, lng: 78.962 },
            { lat: 20.594, lng: 78.962 },
            { lat: 20.594, lng: 78.963 },
            { lat: 20.593, lng: 78.963 },
          ]}
          onClose={() => setShowDetail(false)} 
        />
      )}
    </>
  );
}

export default App;
