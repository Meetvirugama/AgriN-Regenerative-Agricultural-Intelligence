import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useActiveField } from "../app/providers/FieldProvider";

import { GrowthStageBanner } from "../features/crop-context/components/GrowthStageBanner";
import { StageProgressIndicator } from "../features/crop-context/components/StageProgressIndicator";
import { CropPhotoCapture } from "../features/crop-context/components/CropPhotoCapture";
import { weatherApi } from "../features/weather-intelligence/api/weatherApi";
import { WeatherAlertBanner } from "../features/weather-intelligence/components/WeatherAlertBanner";
import { WeatherStrip } from "../features/weather-intelligence/components/WeatherStrip";
import { WeatherDetails } from "../features/weather-intelligence/components/WeatherDetails";
import { soilApi } from "../features/soil-intelligence/api/soilApi";
import { SoilSummaryCard } from "../features/soil-intelligence/components/SoilSummaryCard";
import { SoilUploadFlow } from "../features/soil-intelligence/components/SoilUploadFlow";
import {
  SatelliteHealthCard,
  SatelliteDetailView,
  useSatelliteHealth,
} from "../features/satellite-health";
import { DiseaseDiagnosisFlow } from "../features/disease-diagnosis/components/DiseaseDiagnosisFlow";
import { RegenPlanningCard } from "../features/regen-ag/components/RegenPlanningCard";
import {
  FieldHealthHero,
  HealthDimensionCard,
  useHealthScore,
} from "../features/health-score";
import { ClimateRiskWidget } from "../features/climate-risk/components/ClimateRiskWidget";
import { AdvisoryCard } from "../features/agro-advisory/components/AdvisoryCard";
import { memoryApi } from "../features/field-memory/api/memoryApi";
import { FeedbackPrompt } from "../features/field-memory/components/FeedbackPrompt";
import { FieldTimeline } from "../features/field-memory/components/FieldTimeline";
import { GlobalInsightsWidget } from "../features/cross-border";
import { cropApi } from "../features/crop-context/api/cropApi";
import {
  Camera,
  Droplets,
  Mountain,
  CloudLightning,
  Bug,
  ThermometerSun,
  Leaf,
} from "lucide-react";
import { ErrorState } from "../components/ui/ErrorState";
import { FeatureErrorBoundary } from "../components/ui/FeatureErrorBoundary";

const FieldSatelliteWrapper = ({ fieldId }) => {
  const [showDetail, setShowDetail] = useState(false);
  const { data, loading, error } = useSatelliteHealth(fieldId);

  if (error) {
    return (
      <ErrorState
        title="Satellite Data Failed"
        message="Failed to load satellite data."
      />
    );
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

const FieldHealthScoreWrapper = ({ fieldId }) => {
  const { data: score, loading, error } = useHealthScore(fieldId);

  if (error) {
    return (
      <ErrorState
        title="Health Score Failed"
        message="Failed to load field health score."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FieldHealthHero score={score} loading={loading} />
      {score && !loading && (
        <div className="grid grid-cols-2 gap-2">
          <HealthDimensionCard
            title="Water"
            dimension={score.water_condition}
            icon={<Droplets size={16} />}
          />
          <HealthDimensionCard
            title="Soil"
            dimension={score.soil_condition}
            icon={<Mountain size={16} />}
          />
          <HealthDimensionCard
            title="Weather"
            dimension={score.weather_risk}
            icon={<CloudLightning size={16} />}
          />
          <HealthDimensionCard
            title="Disease"
            dimension={score.disease_risk}
            icon={<Bug size={16} />}
          />
          <HealthDimensionCard
            title="Climate"
            dimension={score.climate_stress}
            icon={<ThermometerSun size={16} />}
          />
          <HealthDimensionCard
            title="Vegetation"
            dimension={score.vegetation_trend}
            icon={<Leaf size={16} />}
          />
        </div>
      )}
    </div>
  );
};

export const Field = () => {
  const { fieldId } = useParams();
  const {
    cropState,
    isLoading,
    error: initError,
    setCropState,
  } = useActiveField();
  const [showOverride, setShowOverride] = useState(false);
  const [showDiagnosisFlow, setShowDiagnosisFlow] = useState(false);

  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  const [soilProfile, setSoilProfile] = useState(null);
  const [isSoilLoading, setIsSoilLoading] = useState(true);
  const [showSoilUpload, setShowSoilUpload] = useState(false);

  const [pendingPrompts, setPendingPrompts] = useState([]);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    if (!fieldId) return;

    async function fetchData() {
      // Non-blocking parallel data fetches for this field
      const [weatherResult, soilResult, promptsResult, timelineResult] =
        await Promise.allSettled([
          weatherApi.getForecast(fieldId),
          soilApi.getSoilProfile(fieldId),
          memoryApi.getPendingPrompts(fieldId),
          memoryApi.getTimeline(fieldId),
        ]);

      if (weatherResult.status === "fulfilled")
        setWeatherData(weatherResult.value);
      setIsWeatherLoading(false);

      if (soilResult.status === "fulfilled") setSoilProfile(soilResult.value);
      setIsSoilLoading(false);

      if (promptsResult.status === "fulfilled")
        setPendingPrompts(promptsResult.value);
      if (timelineResult.status === "fulfilled")
        setTimeline(timelineResult.value);
    }
    fetchData();
  }, [fieldId]);

  const handleIdentify = async (blob) => {
    if (!fieldId) return;
    return await cropApi.identifyCrop(fieldId, blob);
  };

  const handleOverrideConfirm = async (cropType, stage) => {
    if (!fieldId) return;
    try {
      const newState = await cropApi.overrideCropState(fieldId, {
        cropType,
        stage: stage,
      });
      setCropState(newState);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading field dashboard...</p>
      </div>
    );
  }

  if (initError) {
    return <ErrorState title="Initialization Failed" message={initError} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Pending feedback prompt */}
      {pendingPrompts.length > 0 && (
        <FeedbackPrompt
          prompt={pendingPrompts[0]}
          onDismiss={() => setPendingPrompts((prev) => prev.slice(1))}
        />
      )}

      {/* Field Health Score (Layer 06) */}
      {fieldId && (
        <section>
          <FeatureErrorBoundary sectionName="Field Health Score">
            <FieldHealthScoreWrapper fieldId={fieldId} />
          </FeatureErrorBoundary>
        </section>
      )}

      {/* Weather Alert Banner */}
      {!isWeatherLoading && weatherData && (
        <FeatureErrorBoundary sectionName="Weather Alerts" compact>
          <WeatherAlertBanner flags={weatherData.flags} />
        </FeatureErrorBoundary>
      )}

      {/* AI Advisory (Layer 09) */}
      {fieldId && (
        <section>
          <FeatureErrorBoundary sectionName="AI Advisory">
            <AdvisoryCard fieldId={fieldId} />
          </FeatureErrorBoundary>
        </section>
      )}

      {/* Crop Context (Layer 02) */}
      <section className="flex flex-col gap-6 mt-2">
        <FeatureErrorBoundary sectionName="Crop Stage">
          <GrowthStageBanner
            cropState={cropState}
            isLoading={isLoading}
            onOverrideClick={() => setShowOverride(true)}
          />

          <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm">
            <h3 className="font-bold mb-6 tracking-wide text-sm text-text-muted uppercase">
              Season Progress
            </h3>
            {isLoading ? (
              <div className="h-16 animate-pulse bg-neutral/20 rounded"></div>
            ) : (
              <StageProgressIndicator currentStage={cropState?.current_stage} />
            )}
          </div>
        </FeatureErrorBoundary>
      </section>

      {/* Weather (Layer 03) */}
      <section className="flex flex-col gap-4 mt-6">
        <FeatureErrorBoundary sectionName="Weather">
          <WeatherStrip
            forecasts={weatherData?.forecasts || []}
            flags={weatherData?.flags || []}
            isLoading={isWeatherLoading}
            onExpand={() => setShowWeatherDetails(!showWeatherDetails)}
          />

          {showWeatherDetails && weatherData && (
            <WeatherDetails forecasts={weatherData.forecasts} />
          )}
        </FeatureErrorBoundary>
      </section>

      {/* Climate Risk (Layer 08) */}
      <section className="flex flex-col gap-4 mt-6">
        {fieldId && (
          <FeatureErrorBoundary sectionName="Climate Risk">
            <ClimateRiskWidget fieldId={fieldId} />
          </FeatureErrorBoundary>
        )}
      </section>

      {/* Soil (Layer 04) */}
      <section className="flex flex-col gap-4 mt-6">
        <FeatureErrorBoundary sectionName="Soil Intelligence">
          <SoilSummaryCard
            profile={soilProfile}
            isLoading={isSoilLoading}
            onUploadClick={() => setShowSoilUpload(true)}
          />
        </FeatureErrorBoundary>
      </section>

      {/* Satellite (Layer 05) */}
      <section className="flex flex-col gap-4 mt-6">
        {fieldId && (
          <FeatureErrorBoundary sectionName="Satellite Health">
            <FieldSatelliteWrapper fieldId={fieldId} />
          </FeatureErrorBoundary>
        )}
      </section>

      {/* Regen + Cross-border (Layer 10 / 14) */}
      <section className="flex flex-col gap-4 mt-6">
        {fieldId && (
          <FeatureErrorBoundary sectionName="Regenerative Planning">
            <RegenPlanningCard fieldId={fieldId} />
          </FeatureErrorBoundary>
        )}
        {fieldId && (
          <FeatureErrorBoundary sectionName="Global Insights" compact>
            <GlobalInsightsWidget fieldId={fieldId} />
          </FeatureErrorBoundary>
        )}
      </section>

      {/* Field History Timeline (Layer 12) */}
      <section className="mt-8 mb-24 border-t-2 border-neutral/30 pt-4">
        <FeatureErrorBoundary sectionName="Field Timeline" compact>
          <FieldTimeline entries={timeline} />
        </FeatureErrorBoundary>
      </section>

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
};
