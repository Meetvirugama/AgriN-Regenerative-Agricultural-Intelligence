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
import { DiseaseDiagnosisFlow } from './features/disease-diagnosis/components/DiseaseDiagnosisFlow';
import { RegenPlanningCard } from './features/regen-ag/components/RegenPlanningCard';
import { FieldHealthHero, HealthDimensionCard, useHealthScore } from './features/health-score';
import { ClimateRiskWidget } from './features/climate-risk/components/ClimateRiskWidget';
import { AdvisoryCard } from './features/agro-advisory/components/AdvisoryCard';
import { LanguageSwitcher } from './features/voice/components/LanguageSwitcher';
import { GlobalMicButton } from './features/voice/components/GlobalMicButton';
import { memoryApi } from './features/field-memory/api/memoryApi';
import { PendingPrompt, FieldTimelineEntry } from './features/field-memory/types';
import { FeedbackPrompt } from './features/field-memory/components/FeedbackPrompt';
import { FieldTimeline } from './features/field-memory/components/FieldTimeline';
import { GlobalInsightsWidget } from './features/cross-border';
import { ExtensionDashboard } from './features/escalation-dashboard';
import { Camera, Droplets, Mountain, CloudLightning, Bug, ThermometerSun, Leaf, ArrowRightLeft } from 'lucide-react';

// Satellite card + detail modal wrapper
const FieldSatelliteWrapper = ({ fieldId }: { fieldId: string }) => {
  const [showDetail, setShowDetail] = useState(false);
  const { data, loading, error } = useSatelliteHealth(fieldId);

  if (error) {
    return <div className="border border-error p-4 text-error text-sm rounded-xl">Failed to load satellite data.</div>;
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
};

// Field Health Score synthesis wrapper (Layer 06)
const FieldHealthScoreWrapper = ({ fieldId }: { fieldId: string }) => {
  const { data: score, loading, error } = useHealthScore(fieldId);

  if (error) {
    return <div className="border border-error p-4 text-error text-sm rounded-xl">Failed to load field health score.</div>;
  }

  return (
    <div className="space-y-4">
      <FieldHealthHero score={score} loading={loading} />
      {score && !loading && (
        <div className="grid grid-cols-2 gap-2">
          <HealthDimensionCard title="Water" dimension={score.water_condition} icon={<Droplets size={16} />} />
          <HealthDimensionCard title="Soil" dimension={score.soil_condition} icon={<Mountain size={16} />} />
          <HealthDimensionCard title="Weather" dimension={score.weather_risk} icon={<CloudLightning size={16} />} />
          <HealthDimensionCard title="Disease" dimension={score.disease_risk} icon={<Bug size={16} />} />
          <HealthDimensionCard title="Climate" dimension={score.climate_stress} icon={<ThermometerSun size={16} />} />
          <HealthDimensionCard title="Vegetation" dimension={score.vegetation_trend} icon={<Leaf size={16} />} />
        </div>
      )}
    </div>
  );
};

function App() {
  const [persona, setPersona] = useState<'farmer' | 'extension'>('farmer');
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [cropState, setCropState] = useState<FieldCropState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);
  const [showDiagnosisFlow, setShowDiagnosisFlow] = useState(false);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  const [soilProfile, setSoilProfile] = useState<SoilProfile | null>(null);
  const [isSoilLoading, setIsSoilLoading] = useState(true);
  const [showSoilUpload, setShowSoilUpload] = useState(false);

  const [pendingPrompts, setPendingPrompts] = useState<PendingPrompt[]>([]);
  const [timeline, setTimeline] = useState<FieldTimelineEntry[]>([]);

  useEffect(() => {
    async function init() {
      let currentFieldId: string | null = null;

      // Step 1: Init field (single call — creates one mock field)
      try {
        const { field } = await cropApi.initStub();
        currentFieldId = field.id;
        setFieldId(field.id);
        const state = await cropApi.fetchCropState(field.id);
        setCropState(state);
      } catch (err: any) {
        console.error('Initialization failed', err);
        setError('Failed to load field data. Please try again.');
      } finally {
        setIsLoading(false);
      }

      if (!currentFieldId) return;
      const fid = currentFieldId;

      // Step 2: Non-blocking parallel data fetches
      const [weatherResult, soilResult, promptsResult, timelineResult] = await Promise.allSettled([
        weatherApi.getForecast(fid),
        soilApi.getSoilProfile(fid),
        memoryApi.getPendingPrompts(fid),
        memoryApi.getTimeline(fid),
      ]);

      if (weatherResult.status === 'fulfilled') setWeatherData(weatherResult.value);
      setIsWeatherLoading(false);

      if (soilResult.status === 'fulfilled') setSoilProfile(soilResult.value);
      setIsSoilLoading(false);

      if (promptsResult.status === 'fulfilled') setPendingPrompts(promptsResult.value);
      if (timelineResult.status === 'fulfilled') setTimeline(timelineResult.value);
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

  if (persona === 'extension') {
    return (
      <div className="relative">
        <button
          onClick={() => setPersona('farmer')}
          className="fixed top-4 right-4 z-50 bg-neutral/80 backdrop-blur text-text font-bold px-4 py-2 rounded-full shadow border border-neutral flex items-center gap-2 hover:bg-neutral transition-colors"
        >
          <ArrowRightLeft size={16} />
          Switch to Farmer
        </button>
        <ExtensionDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex justify-center p-4 relative">
      {/* Global voice mic — positioned bottom-left to avoid camera FAB at bottom-right */}
      <GlobalMicButton />

      <button
        onClick={() => setPersona('extension')}
        className="absolute top-4 right-4 z-50 bg-neutral/80 backdrop-blur text-text font-bold px-4 py-2 rounded-full shadow border border-neutral flex items-center gap-2 hover:bg-neutral transition-colors"
      >
        <ArrowRightLeft size={16} />
        Switch to Extension Officer
      </button>

      <div className="w-full max-w-md flex flex-col gap-6 mt-8">
        <header className="mb-2 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-text tracking-tight">AgriMesh</h1>
            <p className="text-text-muted">Field Intelligence Dashboard</p>
          </div>
          <LanguageSwitcher />
        </header>

        {/* Pending feedback prompt */}
        {pendingPrompts.length > 0 && (
          <FeedbackPrompt
            prompt={pendingPrompts[0]}
            onDismiss={() => setPendingPrompts(prev => prev.slice(1))}
          />
        )}

        {/* Field Health Score (Layer 06) */}
        {fieldId && (
          <section>
            <FieldHealthScoreWrapper fieldId={fieldId} />
          </section>
        )}

        {/* Weather Alert Banner */}
        {!isWeatherLoading && weatherData && (
          <WeatherAlertBanner flags={weatherData.flags} />
        )}

        {/* AI Advisory (Layer 09) */}
        {fieldId && (
          <section>
            <AdvisoryCard fieldId={fieldId} />
          </section>
        )}

        {/* Crop Context (Layer 02) */}
        <section className="flex flex-col gap-6 mt-2">
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

        {/* Weather (Layer 03) */}
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

        {/* Climate Risk (Layer 08) */}
        <section className="flex flex-col gap-4 mt-6">
          {fieldId && <ClimateRiskWidget fieldId={fieldId} />}
        </section>

        {/* Soil (Layer 04) */}
        <section className="flex flex-col gap-4 mt-6">
          <SoilSummaryCard
            profile={soilProfile}
            isLoading={isSoilLoading}
            onUploadClick={() => setShowSoilUpload(true)}
          />
        </section>

        {/* Satellite (Layer 05) */}
        <section className="flex flex-col gap-4 mt-6">
          {fieldId && <FieldSatelliteWrapper fieldId={fieldId} />}
        </section>

        {/* Regen + Cross-border (Layer 10 / 14) */}
        <section className="flex flex-col gap-4 mt-6">
          {fieldId && <RegenPlanningCard fieldId={fieldId} />}
          {fieldId && <GlobalInsightsWidget fieldId={fieldId} />}
        </section>

        {/* Field History Timeline (Layer 12) */}
        <section className="mt-8 mb-24 border-t-2 border-neutral/30 pt-4">
          <FieldTimeline entries={timeline} />
        </section>
      </div>

      {/* Crop diagnosis FAB (bottom-right) */}
      {fieldId && !showDiagnosisFlow && (
        <button
          onClick={() => setShowDiagnosisFlow(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-primary-content rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary z-40"
          aria-label="Inspect Crop"
        >
          <Camera size={32} />
        </button>
      )}

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

      {showDiagnosisFlow && fieldId && (
        <DiseaseDiagnosisFlow
          fieldId={fieldId}
          onClose={() => setShowDiagnosisFlow(false)}
        />
      )}
    </div>
  );
}

export default App;
