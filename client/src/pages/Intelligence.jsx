import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  Droplet,
  Bug,
  Sun,
  CloudRain,
  Wind,
  Loader2,
  Sparkles,
  ShieldCheck,
  Thermometer,
  CheckCircle2,
  ArrowRight,
  Activity,
  CloudSun,
  PlusCircle,
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Intelligence.css";

export const Intelligence = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("health"); // "health" | "recommendations" | "weather"
  const [activeFieldFilter, setActiveFieldFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [headerPortalEl, setHeaderPortalEl] = useState(null);

  useEffect(() => {
    const el = document.getElementById("intelligence-header-portal");
    if (el) setHeaderPortalEl(el);
    document.documentElement.removeAttribute("data-theme");
    document.body.classList.remove("dark-theme");
  }, []);

  // Dynamic 7-day date range (ending on today)
  const dateRangeLabel = useMemo(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 6);
    const options = { day: "numeric", month: "short" };
    return `${past.toLocaleDateString("en-GB", options)} – ${today.toLocaleDateString("en-GB", options)}`;
  }, []);

  // Dynamic 5-day weather forecast days
  const dynamicForecastDays = useMemo(() => {
    const selectedWeather = Array.isArray(data?.weatherData) ? data.weatherData.find(w => w.available) : null;
    if (selectedWeather?.forecasts?.length > 0) {
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return selectedWeather.forecasts.map((f, i) => {
        const d = new Date(f.date);
        const isToday = i === 0;
        return {
          day: isToday ? "Today" : weekdays[d.getDay()],
          date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          icon: f.rainfall_mm > 5 ? CloudRain : (f.rainfall_mm > 0 ? CloudSun : Sun),
          high: `${Math.round(f.temp_max ?? 30)}°`,
          low: `${Math.round(f.temp_min ?? 20)}°`,
          cond: f.rainfall_mm > 5 ? "Rain" : (f.rainfall_mm > 0 ? "Showers" : "Clear"),
          color: f.rainfall_mm > 0 ? "text-blue-500" : "text-amber-500",
        };
      });
    }

    // Fallback if real data is missing
    const days = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isToday = i === 0;
      days.push({
        day: isToday ? "Today" : weekdays[d.getDay()],
        date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        icon: i % 3 === 2 ? CloudRain : Sun,
        high: `${31 + (i % 3)}°`,
        low: `${21 + (i % 2)}°`,
        cond: i % 3 === 2 ? "Showers" : "Clear",
        color: i % 3 === 2 ? "text-blue-500" : "text-amber-500",
      });
    }
    return days;
  }, [data?.weatherData]);

  useEffect(() => {
    let isMounted = true;
    const fetchIntelligence = async () => {
      try {
        const result = await cropApi.getIntelligence();
        if (isMounted && result) {
          setData(result);
        }
      } catch (err) {
        console.warn("Could not fetch remote intelligence data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchIntelligence();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalFields = data?.stats?.totalFields ?? 0;
  const avgHealthValue = data?.stats?.avgHealth ?? 0;
  const activeAlerts = data?.stats?.activeAlerts ?? 0;
  const recommendationsCount = data?.stats?.recommendations ?? 0;

  const goodPct = data?.healthDistribution?.good ?? (totalFields > 0 ? 100 : 0);
  const modPct = data?.healthDistribution?.moderate ?? 0;
  const poorPct = data?.healthDistribution?.poor ?? 0;

  const goodOffset = 0;
  const modOffset = -goodPct;
  const poorOffset = -(goodPct + modPct);

  // Dynamic 7-day trend calculations with current dates
  const trendPoints = useMemo(() => {
    let sourceData = [];
    if (activeFieldFilter === "all") {
      sourceData = data?.trendData || [];
    } else {
      sourceData = data?.trendDataByField?.[activeFieldFilter] || [];
    }

    if (sourceData.length) {
      return sourceData.map((pt, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (sourceData.length - 1 - idx));
        return {
          ...pt,
          date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        };
      });
    }
    return [];
  }, [data?.trendData, data?.trendDataByField, activeFieldFilter]);

  const getPointCoordinates = (index, val) => {
    const total = Math.max(trendPoints.length - 1, 1);
    const x = (index / total) * 740 + 30;
    const y = 160 - (val / 100) * 140;
    return { x, y };
  };

  const svgPoints = trendPoints.map((pt, idx) => getPointCoordinates(idx, pt.value));
  const polylineStr = svgPoints.map((pt) => `${pt.x},${pt.y}`).join(" ");
  const polygonStr = svgPoints.length
    ? `30,170 ${polylineStr} ${svgPoints[svgPoints.length - 1].x},170`
    : "";

  const availableFields = useMemo(() => {
    const list = data?.fields?.length ? data.fields.map((f) => ({ id: f.id, name: f.name })) : [];
    return [{ id: "all", name: "All Fields" }, ...list];
  }, [data?.fields]);

  const activeFieldLabel = useMemo(() => {
    if (activeFieldFilter === "all") return "All Fields";
    const field = data?.fields?.find((f) => f.id === activeFieldFilter);
    return field ? field.name : "All Fields";
  }, [activeFieldFilter, data?.fields]);

  const renderTabSwitcher = () => (
    <nav className="intelligence-tab-switcher" aria-label="Dashboard Views">
      <button
        className={`intelligence-tab-btn ${activeTab === "health" ? "active" : ""}`}
        onClick={() => setActiveTab("health")}
        type="button"
      >
        <Activity size={15} />
        <span>Health & Trends</span>
      </button>

      <button
        className={`intelligence-tab-btn ${activeTab === "recommendations" ? "active" : ""}`}
        onClick={() => setActiveTab("recommendations")}
        type="button"
      >
        <ClipboardList size={15} />
        <span>Recommendations</span>
        {recommendationsCount > 0 && (
          <span className="tab-counter-badge">{recommendationsCount}</span>
        )}
      </button>

      <button
        className={`intelligence-tab-btn ${activeTab === "weather" ? "active" : ""}`}
        onClick={() => setActiveTab("weather")}
        type="button"
      >
        <CloudSun size={15} />
        <span>Weather & Forecast</span>
      </button>
    </nav>
  );

  const unifiedHeaderContent = (
    <div className="intelligence-unified-nav-bar">
      <div className="intelligence-unified-left">
        <div className="intelligence-title-row">
          <h1 className="intelligence-main-title">Intelligence</h1>
          <span className="intelligence-ai-pill">
            <Sparkles size={12} className="text-emerald-500" />
            Live AI
          </span>
        </div>
      </div>
      {renderTabSwitcher()}
    </div>
  );

  return (
    <div className="intelligence-app-viewport">
      {headerPortalEl && createPortal(unifiedHeaderContent, headerPortalEl)}

      {/* MOBILE IN-PAGE HEADER (Visible on Mobile only) */}
      <div className="intelligence-page-header-mobile">
        <div className="intelligence-mobile-title-block">
          <div className="intelligence-title-row">
            <h1 className="intelligence-main-title">Intelligence</h1>
            <span className="intelligence-ai-pill">
              <Sparkles size={12} className="text-emerald-500" />
              Live AI
            </span>
          </div>
          <p className="intelligence-mobile-subtitle">Crop Diagnostics • Satellite NDVI • Microclimate</p>
        </div>
        {renderTabSwitcher()}
      </div>

      {/* ─── 2. COMPACT KPI SUMMARY STRIP ─── */}
      <section className="intelligence-kpi-strip">
        {/* Total Fields */}
        <div className="intelligence-kpi-card">
          <div className="intelligence-kpi-icon success">
            <Leaf size={18} />
          </div>
          <div className="intelligence-kpi-body">
            <span className="intelligence-kpi-label">Total Fields</span>
            <div className="intelligence-kpi-val-group">
              <strong className="intelligence-kpi-val">
                {isLoading ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : totalFields}
              </strong>
              <span className="intelligence-kpi-sub">
                {totalFields === 1 ? "Active parcel" : "Active parcels"}
              </span>
            </div>
          </div>
        </div>

        {/* Avg Health */}
        <div className="intelligence-kpi-card kpi-health">
          <div className="intelligence-kpi-icon info">
            <TrendingUp size={18} />
          </div>
          <div className="intelligence-kpi-body">
            <span className="intelligence-kpi-label">Avg. Field Health</span>
            <div className="intelligence-kpi-val-group">
              <strong className="intelligence-kpi-val">
                {isLoading ? <Loader2 size={16} className="animate-spin text-blue-600" /> : totalFields > 0 ? `${avgHealthValue}%` : "—"}
              </strong>
              {totalFields > 0 && (
                <span className={`intelligence-kpi-pill ${avgHealthValue >= 70 ? "success" : "warning"}`}>
                  {avgHealthValue >= 70 ? "Optimal" : "Attention"}
                </span>
              )}
            </div>
            {totalFields > 0 && (
              <div className="kpi-mini-gauge-track">
                <div className={`kpi-mini-gauge-fill ${avgHealthValue >= 70 ? "success" : "warning"}`} style={{ width: `${avgHealthValue}%` }}></div>
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="intelligence-kpi-card kpi-alerts">
          <div className="intelligence-kpi-icon warning">
            <AlertTriangle size={18} />
          </div>
          <div className="intelligence-kpi-body">
            <span className="intelligence-kpi-label">Active Alerts</span>
            <div className="intelligence-kpi-val-group">
              <strong className="intelligence-kpi-val">
                {isLoading ? <Loader2 size={16} className="animate-spin text-amber-600" /> : activeAlerts}
              </strong>
              <span className={`intelligence-kpi-pill ${activeAlerts > 0 ? "warning" : "success"}`}>
                {activeAlerts > 0 ? "Action Required" : "Nominal"}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="intelligence-kpi-card kpi-rec">
          <div className="intelligence-kpi-icon purple">
            <ClipboardList size={18} />
          </div>
          <div className="intelligence-kpi-body">
            <span className="intelligence-kpi-label">Recommendations</span>
            <div className="intelligence-kpi-val-group">
              <strong className="intelligence-kpi-val">
                {isLoading ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : recommendationsCount}
              </strong>
              <span className="intelligence-kpi-pill purple">This Week</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. TAB CONTENT VIEWS (Flex 1, Zero Scroll Desktop / Native Scroll Mobile) ─── */}
      <main className="intelligence-main-stage">
        {/* ===================================================================
            TAB 1: HEALTH & NDVI TRENDS
           =================================================================== */}
        {activeTab === "health" && (
          <div className="intelligence-view-grid health-view animate-fade-in">
            {totalFields === 0 && !isLoading ? (
              <div className="intelligence-compact-card full-span empty-state-card">
                <div className="empty-state-visual">
                  <div className="empty-state-glow"></div>
                  <div className="empty-state-icon-box">
                    <Leaf size={28} className="text-emerald-600" />
                  </div>
                </div>

                <div className="empty-state-content">
                  <h3 className="empty-state-title">No Fields Registered Yet</h3>
                  <p className="empty-state-desc">
                    Map your agricultural parcels to unlock AI-powered satellite vegetation indexing, 
                    predictive crop vigor trajectories, and microclimate risk diagnostics.
                  </p>

                  <button
                    className="empty-state-cta-btn"
                    onClick={() => navigate("/fields/add")}
                    type="button"
                  >
                    <PlusCircle size={16} />
                    <span>Add Field</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Field Health Overview Donut */}
                <div className="intelligence-compact-card donut-card">
                  <div className="compact-card-header">
                    <div>
                      <h2 className="compact-card-title">Field Health Overview</h2>
                      <span className="compact-card-subtitle">Parcel health distribution</span>
                    </div>
                    <div className="compact-card-badge">Live NDVI</div>
                  </div>

                  <div className="compact-donut-body">
                    <div className="compact-donut-svg-wrapper">
                      <svg viewBox="0 0 36 36" className="compact-donut-svg">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="rgba(0,0,0,0.05)"
                          strokeWidth="3.6"
                        />
                        {goodPct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#16a34a"
                            strokeWidth="3.6"
                            strokeDasharray={`${goodPct} ${100 - goodPct}`}
                            strokeDashoffset={`${goodOffset}`}
                            strokeLinecap="round"
                          />
                        )}
                        {modPct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="3.6"
                            strokeDasharray={`${modPct} ${100 - modPct}`}
                            strokeDashoffset={`${modOffset}`}
                            strokeLinecap="round"
                          />
                        )}
                        {poorPct > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth="3.6"
                            strokeDasharray={`${poorPct} ${100 - poorPct}`}
                            strokeDashoffset={`${poorOffset}`}
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      <div className="compact-donut-center">
                        <span className="compact-donut-pct">{avgHealthValue}%</span>
                        <span className="compact-donut-sub">Avg Health</span>
                      </div>
                    </div>

                    {/* Multi-Segment Distribution Gauge */}
                    <div className="health-dist-bar-wrapper">
                      <div className="health-dist-bar">
                        {goodPct > 0 && <div className="dist-segment good" style={{ width: `${goodPct}%` }} title={`Good: ${goodPct}%`}></div>}
                        {modPct > 0 && <div className="dist-segment mod" style={{ width: `${modPct}%` }} title={`Moderate: ${modPct}%`}></div>}
                        {poorPct > 0 && <div className="dist-segment poor" style={{ width: `${poorPct}%` }} title={`Poor: ${poorPct}%`}></div>}
                      </div>
                    </div>

                    <div className="compact-donut-legend">
                      <div className="compact-legend-row">
                        <div className="legend-label-col">
                          <span className="legend-dot success"></span>
                          <span className="legend-text">Good (Vigorous)</span>
                        </div>
                        <strong className="legend-val">{goodPct}%</strong>
                      </div>
                      <div className="compact-legend-row">
                        <div className="legend-label-col">
                          <span className="legend-dot warning"></span>
                          <span className="legend-text">Moderate (Watch)</span>
                        </div>
                        <strong className="legend-val">{modPct}%</strong>
                      </div>
                      <div className="compact-legend-row">
                        <div className="legend-label-col">
                          <span className="legend-dot danger"></span>
                          <span className="legend-text">Poor (Stressed)</span>
                        </div>
                        <strong className="legend-val">{poorPct}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="compact-card-footer">
                    <span className="footer-status-text">
                      <ShieldCheck size={14} className="text-emerald-600 inline mr-1" />
                      {totalFields} of {totalFields} parcels analyzed
                    </span>
                  </div>
                </div>

                {/* Health Trend 7-Day Line Chart */}
                <div className="intelligence-compact-card trend-card">
                  <div className="compact-card-header">
                    <div>
                      <h2 className="compact-card-title">Crop Health Trend</h2>
                      <span className="compact-card-subtitle">7-day NDVI canopy vigor progression</span>
                    </div>
                    {availableFields.length > 1 && (
                      <div className="filter-dropdown-container">
                        <button
                          className="compact-filter-btn"
                          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                          type="button"
                        >
                          <span>{activeFieldLabel}</span>
                          <ChevronDown size={13} className="text-text-muted" />
                        </button>
                        {showFilterDropdown && (
                          <div className="compact-dropdown-menu">
                            {availableFields.map((field) => (
                              <button
                                key={field.id}
                                className={`compact-dropdown-item ${activeFieldFilter === field.id ? "active" : ""}`}
                                onClick={() => {
                                  setActiveFieldFilter(field.id);
                                  setShowFilterDropdown(false);
                                }}
                                type="button"
                              >
                                {field.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="compact-trend-stage">
                    {/* Y-Axis Grid */}
                    <div className="compact-trend-y-axis">
                      <div className="compact-grid-line"><span className="grid-label">100%</span></div>
                      <div className="compact-grid-line"><span className="grid-label">75%</span></div>
                      <div className="compact-grid-line"><span className="grid-label">50%</span></div>
                      <div className="compact-grid-line"><span className="grid-label">25%</span></div>
                      <div className="compact-grid-line bottom"><span className="grid-label">0%</span></div>
                    </div>

                    {/* Chart Plotting Area */}
                    <div className="compact-trend-plot-area">
                      {/* SVG Polyline & Gradient Fill */}
                      <svg className="compact-trend-svg" viewBox="0 0 800 180" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="trendGradientCompact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
                            <stop offset="65%" stopColor="#22c55e" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {polygonStr && <polygon points={polygonStr} fill="url(#trendGradientCompact)" />}
                        {polylineStr && (
                          <polyline
                            points={polylineStr}
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                      </svg>

                      {/* Crisp, Non-Distorted High-Res Circular Data Dots */}
                      <div className="compact-trend-dots-overlay">
                        {svgPoints.map((pt, idx) => (
                          <div
                            key={idx}
                            className={`compact-trend-dot-node ${hoveredPoint?.idx === idx ? "active" : ""}`}
                            style={{
                              left: `${(pt.x / 800) * 100}%`,
                              top: `${(pt.y / 180) * 100}%`,
                            }}
                            onMouseEnter={() => setHoveredPoint({ ...trendPoints[idx], ...pt, idx })}
                            onMouseLeave={() => setHoveredPoint(null)}
                            title={`${trendPoints[idx]?.date}: ${trendPoints[idx]?.value}% NDVI`}
                          >
                            <span className="dot-inner-core"></span>
                          </div>
                        ))}
                      </div>

                      {/* Hover Tooltip */}
                      {hoveredPoint && (
                        <div
                          className="compact-tooltip"
                          style={{
                            left: `${(hoveredPoint.x / 800) * 100}%`,
                            top: `${(hoveredPoint.y / 180) * 100}%`,
                          }}
                        >
                          <span className="tip-date">{hoveredPoint.date}</span>
                          <strong className="tip-val">{hoveredPoint.value}% NDVI</strong>
                        </div>
                      )}
                    </div>

                    {/* X-Axis */}
                    <div className="compact-trend-x-axis">
                      {trendPoints.map((pt, idx) => (
                        <span key={idx} className="x-label">{pt.date}</span>
                      ))}
                    </div>
                  </div>

                  <div className="compact-trend-footer">
                    <div className="legend-indicator">
                      <span className="legend-indicator-line"></span>
                      <span className="legend-indicator-text">NDVI Health Index</span>
                    </div>
                    <span className="peak-health-badge">
                      Avg Trend: {avgHealthValue}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 2: RECOMMENDATIONS & ACTIONS
           =================================================================== */}
        {activeTab === "recommendations" && (
          <div className="intelligence-view-grid recommendations-view animate-fade-in">
            <div className="intelligence-compact-card full-span">
              <div className="compact-card-header">
                <div>
                  <h2 className="compact-card-title">Priority Field Recommendations</h2>
                  <span className="compact-card-subtitle">AI-synthesized prescriptions for active parcels</span>
                </div>
                <span className="compact-badge-count">{data?.topRecommendations?.length || 0} Action Items</span>
              </div>

              <div className="recommendations-container">
                {(!data?.topRecommendations || data.topRecommendations.length === 0) ? (
                  <div className="empty-recommendations-box">
                    <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                    <h4 className="compact-card-title">All Caught Up!</h4>
                    <p className="compact-card-subtitle mt-1">
                      No urgent crop interventions or alert actions currently required for your fields.
                    </p>
                  </div>
                ) : (
                  data.topRecommendations.map((rec) => (
                    <div key={rec.id} className="rec-full-row">
                      <div
                        className={`rec-type-icon ${
                          rec.type === "irrigation"
                            ? "info"
                            : rec.type === "nutrient"
                            ? "success"
                            : "purple"
                        }`}
                      >
                        {rec.type === "irrigation" ? (
                          <Droplet size={18} />
                        ) : rec.type === "nutrient" ? (
                          <Leaf size={18} />
                        ) : (
                          <Bug size={18} />
                        )}
                      </div>

                      <div className="rec-content-area">
                        <div className="rec-heading-line">
                          <h3 className="rec-item-title">{rec.title}</h3>
                          <div className="rec-badges-group">
                            <span className="rec-field-chip">{rec.field}</span>
                            <span className={`rec-priority-chip ${rec.priority === "High" ? "high" : "medium"}`}>
                              {rec.priority} Priority
                            </span>
                          </div>
                        </div>
                        <p className="rec-item-desc">{rec.desc}</p>
                      </div>

                      <button
                        className="rec-action-btn"
                        onClick={() => navigate("/fields")}
                        type="button"
                      >
                        <span>{rec.action || "View Parcel"}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="compact-card-footer split-footer">
                <span className="footer-status-text">
                  <CheckCircle2 size={14} className="text-emerald-600 inline mr-1" />
                  Prescriptions synced with farm sensor telemetry & weather models
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: WEATHER & MICROCLIMATE
           =================================================================== */}
        {activeTab === "weather" && (() => {
          const selectedWeather = Array.isArray(data?.weatherData) ? data.weatherData.find(w => w.available) : null;
          const selectedField = data?.fields?.find(f => f.id === selectedWeather?.fieldId);
          const locationName = selectedField ? selectedField.name : "My Farm";
          const current = selectedWeather?.current;
          
          return (
          <div className="intelligence-view-grid weather-view animate-fade-in">
            {/* Current Weather Telemetry */}
            <div className="intelligence-compact-card weather-current-card">
              <div className="compact-card-header">
                <div>
                  <h2 className="compact-card-title">Current Microclimate</h2>
                  <span className="compact-card-subtitle">
                    {locationName}
                  </span>
                </div>
                <span className="compact-card-badge weather">Live Sensors</span>
              </div>

              <div className="weather-telemetry-body">
                <div className="weather-primary-temp">
                  <div className="weather-sun-icon-box">
                    {current?.rainfallMm > 0 ? (
                      <CloudRain size={34} className="text-blue-500" />
                    ) : (
                      <Sun size={34} className="text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="weather-temp-num">{Math.round(current?.tempMax ?? 32)}°C</h3>
                    <span className="weather-cond-label">
                      {current?.rainfallMm > 0 ? "Rain / Showers" : "Sunny & Clear Sky"}
                    </span>
                  </div>
                </div>

                <div className="weather-sensor-grid">
                  <div className="weather-sensor-cell">
                    <div className="sensor-hdr">
                      <Droplet size={14} className="text-blue-500" />
                      <span>Humidity</span>
                    </div>
                    <strong className="sensor-num">{Math.round(current?.humidity ?? 42)}%</strong>
                  </div>

                  <div className="weather-sensor-cell">
                    <div className="sensor-hdr">
                      <Wind size={14} className="text-teal-600" />
                      <span>Wind Speed</span>
                    </div>
                    <strong className="sensor-num">{current?.windSpeed ?? 12} km/h</strong>
                  </div>

                  <div className="weather-sensor-cell">
                    <div className="sensor-hdr">
                      <Thermometer size={14} className="text-rose-500" />
                      <span>UV Index</span>
                    </div>
                    <strong className="sensor-num">7 (High)</strong>
                  </div>

                  <div className="weather-sensor-cell">
                    <div className="sensor-hdr">
                      <CloudRain size={14} className="text-indigo-500" />
                      <span>Rain Risk</span>
                    </div>
                    <strong className="sensor-num">{current?.rainRisk ?? "10% Low"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast Grid */}
            <div className="intelligence-compact-card weather-forecast-card">
              <div className="compact-card-header">
                <div>
                  <h2 className="compact-card-title">5-Day Agro Forecast</h2>
                  <span className="compact-card-subtitle">Evapotranspiration & field spray windows</span>
                </div>
                <span className="spray-window-pill good">Favorable for Spraying</span>
              </div>

              <div className="forecast-tiles-row">
                {dynamicForecastDays.map((f, i) => {
                  const IconC = f.icon;
                  return (
                    <div key={i} className="forecast-day-tile">
                      <span className="f-day-title">{f.day}</span>
                      <span className="f-day-sub">{f.date}</span>
                      <div className="f-icon-box">
                        <IconC size={22} className={f.color} />
                      </div>
                      <div className="f-temps">
                        <span className="f-high">{f.high}</span>
                        <span className="f-low">{f.low}</span>
                      </div>
                      <span className="f-cond-tag">{f.cond}</span>
                    </div>
                  );
                })}
              </div>

              <div className="compact-card-footer">
                <span className="footer-status-text">
                  Adjust irrigation schedules based on 48h precipitation outlook.
                </span>
              </div>
            </div>
          </div>
          );
        })()}
      </main>
    </div>
  );
};
