import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useActiveField } from "../app/providers/FieldProvider";

import { GrowthStageBanner } from "../features/crop-context/components/GrowthStageBanner";
import { StageProgressIndicator } from "../features/crop-context/components/StageProgressIndicator";
import { CropPhotoCapture } from "../features/crop-context/components/CropPhotoCapture";
import { weatherApi } from "../features/weather-intelligence/api/weatherApi";
import { WeatherAlertBanner } from "../features/weather-intelligence/components/WeatherAlertBanner";
import { WeatherStrip } from "../features/weather-intelligence/components/WeatherStrip";
import { WeatherDetails } from "../features/weather-intelligence/components/WeatherDetails";
import { getSoilProfile } from "../features/soil-intelligence/api/soilApi";
import { SoilSummaryCard } from "../features/soil-intelligence/components/SoilSummaryCard";
import { SatelliteHealthCard } from "../features/satellite-health";
import { DiseaseDiagnosisFlow } from "../features/disease-diagnosis/components/DiseaseDiagnosisFlow";
import { diagnosisApi } from "../features/disease-diagnosis/api/diagnosisApi";

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

import { cropApi } from "../features/crop-context/api/cropApi";
import {
  Camera,
  Droplets,
  Mountain,
  CloudLightning,
  Bug,
  ThermometerSun,
  Leaf,
  ArrowLeft,
} from "lucide-react";
import { ErrorState } from "../components/ui/ErrorState";
import { FeatureErrorBoundary } from "../components/ui/FeatureErrorBoundary";

import "./Field.css";



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

  // Map new API shape (score/category/components/evidence) → UI dimension cards
  const dimensions = score ? [
    { title: "Vegetation",   icon: <Leaf size={16} />,           value: score.components?.ndvi?.score,    label: score.components?.ndvi?.satellite_available ? "Sentinel-2" : "unavailable" },
    { title: "Weather Risk", icon: <CloudLightning size={16} />,  value: score.components?.weather?.score, label: (score.components?.weather?.active_flags ?? []).join(", ") || "clear" },
    { title: "Soil",         icon: <Mountain size={16} />,        value: score.components?.soil?.score,    label: "SoilGrids" },
    { title: "Crop Stage",   icon: <ThermometerSun size={16} />,  value: score.components?.stage?.score,   label: "estimated" },
  ] : [];

  return (
    <div className="field-section">
      <FieldHealthHero score={score} loading={loading} />
      {score && !loading && (
        <div className="field-health-grid">
          {dimensions.map(({ title, icon, value, label }) => (
            <HealthDimensionCard
              key={title}
              title={title}
              dimension={{ score: value, label }}
              icon={icon}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Field = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
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

  const [pendingPrompts, setPendingPrompts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [observations, setObservations] = useState([]);
  const [updatingOutcome, setUpdatingOutcome] = useState(null);


  useEffect(() => {
    if (!fieldId) return;

    async function fetchData() {
      // Non-blocking parallel data fetches for this field
      const [weatherResult, soilResult, promptsResult, timelineResult, obsResult] =
        await Promise.allSettled([
          weatherApi.getForecast(fieldId),
          getSoilProfile(fieldId),
          memoryApi.getPendingPrompts(fieldId),
          memoryApi.getTimeline(fieldId),
          diagnosisApi.getObservations(fieldId, 5),
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
      if (obsResult.status === "fulfilled" && Array.isArray(obsResult.value))
        setObservations(obsResult.value);
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
      <div className="field-loading-container">
        <div className="field-spinner"></div>
        <p>Loading field dashboard...</p>
      </div>
    );
  }

  if (initError) {
    return <ErrorState title="Initialization Failed" message={initError} />;
  }

  return (
    <div className="field-container">
      <div style={{ marginBottom: "1.5rem" }}>
        <button 
          onClick={() => navigate("/fields")} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.4rem", 
            background: "none", 
            border: "none", 
            color: "var(--text-muted)", 
            cursor: "pointer", 
            fontWeight: 600, 
            fontSize: "0.85rem",
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back to Fields
        </button>
      </div>

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
      <section className="field-section-mt">
        <FeatureErrorBoundary sectionName="Crop Stage">
          <GrowthStageBanner
            cropState={cropState}
            isLoading={isLoading}
            onOverrideClick={() => setShowOverride(true)}
          />

          <div className="field-card">
            <h3 className="field-card-title">
              Season Progress
            </h3>
            {isLoading ? (
              <div className="field-card-skeleton"></div>
            ) : (
              <StageProgressIndicator currentStage={cropState?.current_stage} />
            )}
          </div>
        </FeatureErrorBoundary>
      </section>

      {/* Weather (Layer 03) */}
      <section className="field-section-spaced">
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
      <section className="field-section-spaced">
        {fieldId && (
          <FeatureErrorBoundary sectionName="Climate Risk">
            <ClimateRiskWidget fieldId={fieldId} />
          </FeatureErrorBoundary>
        )}
      </section>

      {/* Layer 04 & 05: Environmental Intelligence Dashboard */}
      <section className="field-section-spaced mt-8">
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-neutral/5 to-surface border border-white/50 shadow-[inset_0_2px_20px_rgba(255,255,255,0.7)] dark:shadow-none p-6 sm:p-10 overflow-hidden">
          {/* Dashboard Accent */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="h-8 w-1.5 rounded-full bg-primary"></div>
            <h3 className="text-xl font-black text-text uppercase tracking-widest">Environmental Intelligence</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch relative z-10">
            {/* Soil (Layer 04) */}
            <FeatureErrorBoundary sectionName="Soil Intelligence">
              <SoilSummaryCard
                fieldId={fieldId}
                soil={soilProfile}
                onSoilUpdated={setSoilProfile}
                disabled={isSoilLoading}
              />
            </FeatureErrorBoundary>

            {/* Satellite (Layer 05) */}
            {fieldId && (
              <FeatureErrorBoundary sectionName="Satellite Health">
                <SatelliteHealthCard fieldId={fieldId} />
              </FeatureErrorBoundary>
            )}
          </div>
        </div>
      </section>

      {/* Crop Health Observations — Layer 07 history */}
      {observations.length > 0 && (
        <section className="field-section-spaced">
          <div className="field-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 className="field-card-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Bug size={16} /> Recent Diagnoses
              </h3>
              <button
                onClick={() => setShowDiagnosisFlow(true)}
                style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}
              >
                + New
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {observations.map((obs) => {
                const pct = Math.round((obs.confidence ?? 0) * 100);
                const sevColor = { critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#22c55e", none: "#22c55e" }[obs.severity] ?? "#6b7280";
                const catEmoji = { disease: "🦠", pest: "🐛", nutrient_deficiency: "⚗️", water_stress: "💧", heat_stress: "🌡️", healthy: "✅", unknown: "❓" }[obs.condition_category] ?? "🔍";
                const dateStr = obs.submitted_at ? new Date(obs.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
                return (
                  <div key={obs.id} style={{ background: "var(--surface-raised, var(--surface))", border: "1px solid var(--border)", borderRadius: "0.625rem", padding: "0.625rem 0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        {catEmoji} {obs.condition_name ?? "Unknown"}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{dateStr}</span>
                    </div>
                    {/* Confidence bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 70 ? "#22c55e" : pct >= 45 ? "#eab308" : "#ef4444", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>{pct}%</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: 99, background: sevColor + "22", color: sevColor, flexShrink: 0 }}>
                        {obs.severity}
                      </span>
                    </div>
                    {obs.monitor && (
                      <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.15rem" }}>📋 {obs.monitor}</p>
                    )}

                    {/* Layer 08: Outcome Feedback */}
                    <div style={{ marginTop: "0.6rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border)" }}>
                      {obs.outcome && obs.outcome !== "unknown" ? (
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {obs.outcome === "improved" ? <ThumbsUp size={12} color="#22c55e" /> : 
                           obs.outcome === "worsened" ? <ThumbsDown size={12} color="#ef4444" /> : 
                           <Equal size={12} />}
                          Outcome recorded: <strong>{obs.outcome}</strong>
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Did this advice work?</p>
                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            {["improved", "unchanged", "worsened"].map(outcome => (
                              <button
                                key={outcome}
                                disabled={updatingOutcome === obs.id}
                                onClick={async () => {
                                  setUpdatingOutcome(obs.id);
                                  try {
                                    await diagnosisApi.submitObservationFeedback(fieldId, obs.id, outcome);
                                    setObservations(prev => prev.map(o => o.id === obs.id ? { ...o, outcome } : o));
                                  } catch (e) {
                                    console.error("Failed to update outcome:", e);
                                  } finally {
                                    setUpdatingOutcome(null);
                                  }
                                }}
                                style={{ 
                                  flex: 1, 
                                  padding: "0.25rem", 
                                  fontSize: "0.65rem", 
                                  fontWeight: 600,
                                  background: "var(--surface)", 
                                  border: "1px solid var(--border)", 
                                  borderRadius: "0.25rem",
                                  cursor: "pointer",
                                  textTransform: "capitalize",
                                  opacity: updatingOutcome === obs.id ? 0.5 : 1
                                }}
                              >
                                {outcome}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}


      {/* Regen + Cross-border (Layer 10 / 14) */}
      <section className="field-section-spaced">
        {fieldId && (
          <FeatureErrorBoundary sectionName="Regenerative Planning">
            <RegenPlanningCard fieldId={fieldId} />
          </FeatureErrorBoundary>
        )}

      </section>

      {/* Field History Timeline (Layer 12) */}
      <section className="field-timeline-container">
        <FeatureErrorBoundary sectionName="Field Timeline" compact>
          <FieldTimeline entries={timeline} />
        </FeatureErrorBoundary>
      </section>

      {/* Crop diagnosis FAB (bottom-right) */}
      {fieldId && !showDiagnosisFlow && (
        <button
          onClick={() => setShowDiagnosisFlow(true)}
          className="field-fab"
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



      {showDiagnosisFlow && fieldId && (
        <DiseaseDiagnosisFlow
          fieldId={fieldId}
          onClose={() => setShowDiagnosisFlow(false)}
        />
      )}
    </div>
  );
};
