import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  MoreVertical,
  Loader2,
  AlertCircle,
  Thermometer,
  CloudRain,
  Wind,
  Bug,
  MessageSquare,
  BarChart2,
  Bell,
  Zap,
  TrendingUp,
  Sprout,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";
import { useAuth } from "../app/providers/AuthProvider";

// Animated Hover Components
import Cloud2Icon from "../components/hover-ui/cloud-2-icon";
import TriangleAlertIcon from "../components/hover-ui/triangle-alert-icon";
import InfoCircleIcon from "../components/hover-ui/info-circle-icon";

import "./Home.css";

/** Returns greeting based on current hour */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Format a date to relative time */
const formatTime = (isoString) => {
  if (!isoString) return "Just now";
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

/** Health score colour thresholds */
const getHealthStyle = (score) => {
  if (score == null) return { cls: "neutral", label: "No Data" };
  if (score >= 70) return { cls: "good", label: "Good" };
  if (score >= 40) return { cls: "moderate", label: "Moderate" };
  return { cls: "poor", label: "Poor" };
};

/** Crop thumbnail map */
const CROP_IMAGES = {
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop",
  rice: "https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop",
  cotton: "https://images.unsplash.com/photo-1599999905445-9e4f8c9c7a7f?w=150&h=150&fit=crop",
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=150&h=150&fit=crop",
};
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=150&h=150&fit=crop";

// ── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Diagnose", icon: Bug, path: "/diagnosis", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  { label: "Ask AI", icon: MessageSquare, path: "/ask", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  { label: "Market", icon: BarChart2, path: "/market-prices", color: "#0284c7", bg: "rgba(2,132,199,0.08)" },
  { label: "Alerts", icon: Bell, path: "/alerts", color: "#d97706", bg: "rgba(217,119,6,0.08)" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const QuickActionBtn = ({ action }) => {
  const navigate = useNavigate();
  const Icon = action.icon;
  return (
    <button
      className="home-quick-action"
      onClick={() => navigate(action.path)}
      style={{ "--qa-color": action.color, "--qa-bg": action.bg }}
    >
      <div className="home-qa-icon-box">
        <Icon size={20} />
      </div>
      <span className="home-qa-label">{action.label}</span>
    </button>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="home-stat-card" style={{ "--stat-color": color }}>
    <div className="home-stat-icon">
      <Icon size={18} />
    </div>
    <div className="home-stat-info">
      <span className="home-stat-value">{value}</span>
      <span className="home-stat-label">{label}</span>
      {sub && <span className="home-stat-sub">{sub}</span>}
    </div>
  </div>
);

const HomeAlertItem = ({ alert }) => {
  const [isHovered, setIsHovered] = useState(false);
  const priority = (alert.priority || "Low");
  const iconClass =
    priority === "High" ? "danger" : priority === "Medium" ? "warning" : "info";
  const IconComponent =
    priority === "High" || priority === "Medium" ? TriangleAlertIcon : InfoCircleIcon;

  return (
    <div
      className="home-alert-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="home-alert-content">
        <div className={`home-alert-icon ${iconClass}`}>
          <IconComponent size={18} isHovered={isHovered} />
        </div>
        <div className="home-alert-text">
          <h4>{alert.title}</h4>
          <p>{alert.field || "All Fields"}</p>
        </div>
      </div>
      <div className="home-alert-meta">
        <span
          className={`home-card-badge ${
            priority === "High" ? "poor" : priority === "Medium" ? "moderate" : "good"
          }`}
        >
          {priority}
        </span>
        <span className="home-alert-time">{formatTime(alert.createdAt || alert.time)}</span>
      </div>
    </div>
  );
};

const FieldCard = ({ field, onNavigate }) => {
  const cropKey = (field.crop_type || "").toLowerCase();
  const cropDisplay = field.crop_type
    ? field.crop_type.charAt(0).toUpperCase() + field.crop_type.slice(1)
    : "Unknown";
  const img = CROP_IMAGES[cropKey] || FALLBACK_IMG;

  // Real health score from intelligence data (passed in as field.healthScore)
  const health = getHealthStyle(field.healthScore);

  return (
    <div className="home-card" onClick={() => onNavigate(`/fields/${field.id}`)}>
      <div className="home-card-top-content">
        <div className="home-card-info-row">
          <div className="home-card-image">
            <img src={img} alt={cropDisplay} loading="lazy" />
          </div>
          <div className="home-card-text-container">
            <div className="home-card-title-row">
              <h3 className="home-card-title">{field.name}</h3>
              <button
                className="home-card-more-btn"
                aria-label="Field options"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertical size={14} />
              </button>
            </div>
            <p className="home-card-subtitle">
              {cropDisplay}
              {field.area_hectares
                ? ` • ${parseFloat(field.area_hectares).toFixed(1)} ha`
                : ""}
            </p>
          </div>
        </div>

        {/* Health score bar */}
        <div className="home-card-health-row">
          <span className={`home-card-badge ${health.cls}`}>{health.label}</span>
          {field.healthScore != null && (
            <div className="home-health-bar-wrap">
              <div
                className={`home-health-bar-fill ${health.cls}`}
                style={{ width: `${Math.round(field.healthScore)}%` }}
              />
            </div>
          )}
          {field.healthScore != null && (
            <span className="home-health-score-num">{Math.round(field.healthScore)}%</span>
          )}
        </div>
      </div>

      <div className="home-card-footer">
        <span className="home-card-view-hint">
          View field <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
};

const WeatherWidget = ({ weather }) => {
  if (!weather) {
    return (
      <div className="home-weather-empty">
        <Cloud2Icon size={28} className="home-weather-empty-icon" strokeWidth={1.5} />
        <div>
          <p className="home-weather-empty-title">No weather data</p>
          <p className="home-weather-empty-sub">Add a field to see live conditions</p>
        </div>
      </div>
    );
  }
  return (
    <div className="home-weather-grid">
      {weather.tempMax != null && (
        <div className="home-weather-cell">
          <Thermometer size={15} className="hw-icon red" />
          <div>
            <span className="hw-value">{weather.tempMax}°C</span>
            <span className="hw-label">Max Temp</span>
          </div>
        </div>
      )}
      {weather.tempMin != null && (
        <div className="home-weather-cell">
          <Thermometer size={15} className="hw-icon blue" />
          <div>
            <span className="hw-value">{weather.tempMin}°C</span>
            <span className="hw-label">Min Temp</span>
          </div>
        </div>
      )}
      {weather.rainfallMm != null && (
        <div className="home-weather-cell">
          <CloudRain size={15} className="hw-icon sky" />
          <div>
            <span className="hw-value">{weather.rainfallMm} mm</span>
            <span className="hw-label">Rainfall</span>
          </div>
        </div>
      )}
      {weather.humidity != null && (
        <div className="home-weather-cell">
          <Wind size={15} className="hw-icon teal" />
          <div>
            <span className="hw-value">{weather.humidity}%</span>
            <span className="hw-label">Humidity</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── No Fields Empty State ─────────────────────────────────────────────────────
const NoFieldsEmptyState = ({ onAdd }) => (
  <div className="home-empty-state">
    <div className="home-empty-glow" />
    <div className="home-empty-icon-ring">
      <Sprout size={36} strokeWidth={1.5} />
    </div>
    <h2 className="home-empty-title">Welcome to AgriMesh</h2>
    <p className="home-empty-desc">
      Add your first field to start getting AI-powered crop health scores,
      weather alerts, and personalized recommendations.
    </p>
    <button className="home-empty-cta" onClick={onAdd}>
      <Plus size={18} />
      Add Your First Field
    </button>
    <div className="home-empty-features">
      {["Real-time health scoring", "Weather risk alerts", "AI diagnosis"].map((f) => (
        <span key={f} className="home-empty-feature-chip">
          <Zap size={11} /> {f}
        </span>
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const Home = () => {
  const navigate = useNavigate();
  const { farmer } = useAuth();

  const [fields, setFields] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(null);
        const [fieldsData, alertsData, intelligenceData] = await Promise.all([
          cropApi.getAllFields(),
          cropApi.getAlerts(),
          cropApi.getIntelligence().catch(() => null), // non-fatal
        ]);
        setFields(Array.isArray(fieldsData) ? fieldsData : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        setIntelligence(intelligenceData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setLoadError("Unable to load dashboard data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Merge intelligence health scores into field cards
  const displayFields = useMemo(() => {
    const healthMap = new Map(
      (intelligence?.fields ?? []).map((f) => [f.id, f.health?.score ?? null])
    );
    return fields.map((f) => ({
      ...f,
      healthScore: healthMap.get(f.id) ?? null,
    }));
  }, [fields, intelligence]);

  // Get the first available real weather reading
  const liveWeather = useMemo(() => {
    const wd = intelligence?.weatherData;
    if (!Array.isArray(wd)) return null;
    const available = wd.find((w) => w.available && w.current);
    return available?.current ?? null;
  }, [intelligence]);

  // Farm summary stats
  const stats = useMemo(() => {
    const validScores = displayFields
      .map((f) => f.healthScore)
      .filter((s) => s != null);
    const avgHealth =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : null;
    const activeAlerts = alerts.filter((a) => !a.resolved).length;
    return {
      totalFields: fields.length,
      avgHealth,
      activeAlerts,
      recommendations: intelligence?.stats?.recommendations ?? 0,
    };
  }, [displayFields, alerts, fields, intelligence]);

  const greeting = getGreeting();
  const firstName = farmer?.name ? farmer.name.split(" ")[0] : "Farmer";
  const unreadCount = alerts.filter((a) => !a.read).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="home-container">

      {/* ── Header ── */}
      <section className="home-header">
        <div className="home-header-left">
          <h1>{greeting}, {firstName} 👋</h1>
          <p>Here's what's happening across your farm today.</p>
        </div>
        {unreadCount > 0 && (
          <Link to="/alerts" className="home-header-alert-badge">
            <Bell size={14} />
            {unreadCount} unread
          </Link>
        )}
      </section>

      {/* ── Error Banner ── */}
      {loadError && (
        <div className="home-error-banner">
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <section className="home-quick-actions-row">
        {QUICK_ACTIONS.map((a) => (
          <QuickActionBtn key={a.label} action={a} />
        ))}
      </section>

      {isLoading ? (
        <div className="home-loading-full">
          <Loader2 className="home-spinner" size={32} />
          <span>Loading your farm data…</span>
        </div>
      ) : fields.length === 0 ? (
        /* ── No fields empty state ── */
        <NoFieldsEmptyState onAdd={() => navigate("/fields/add")} />
      ) : (
        <>
          {/* ── Farm Summary Stats ── */}
          <div className="home-stats-row">
            <StatCard
              icon={Activity}
              label="Fields"
              value={stats.totalFields}
              color="#16a34a"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Health"
              value={stats.avgHealth != null ? `${stats.avgHealth}%` : "—"}
              color={stats.avgHealth >= 70 ? "#16a34a" : stats.avgHealth >= 40 ? "#d97706" : "#dc2626"}
            />
            <StatCard
              icon={Bell}
              label="Active Alerts"
              value={stats.activeAlerts}
              color={stats.activeAlerts > 0 ? "#d97706" : "#6b7280"}
            />
            <StatCard
              icon={Zap}
              label="AI Tips"
              value={stats.recommendations}
              color="#7c3aed"
            />
          </div>

          {/* ── Row 1: Fields + Recommendation ── */}
          <div className="home-grid-row-1">

            {/* Fields */}
            <section className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">My Fields</h2>
                <Link to="/fields" className="home-section-link">View All</Link>
              </div>
              <div className="home-fields-grid">
                {displayFields.slice(0, 2).map((field) => (
                  <FieldCard key={field.id} field={field} onNavigate={navigate} />
                ))}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/fields/add")}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/fields/add")}
                  className="home-add-field"
                  aria-label="Add new field"
                >
                  <Plus size={26} className="home-add-field-icon" />
                  <span className="home-add-field-label">Add Field</span>
                </div>
              </div>
            </section>

            {/* Weather + Recommendation */}
            <section className="home-section">
              <h2 className="home-section-title">Live Conditions</h2>
              <div className="home-recommendation-card">
                <div className="home-rec-header">
                  <Cloud2Icon size={22} strokeWidth={1.5} className="home-rec-cloud-icon" />
                  <div>
                    <h3 className="home-rec-title">
                      {liveWeather ? fields[0]?.name ?? "Your Farm" : "Weather"}
                    </h3>
                    <p className="home-rec-sub">
                      {liveWeather ? "Real-time microclimate" : "No data fetched yet"}
                    </p>
                  </div>
                </div>

                <WeatherWidget weather={liveWeather} />

                <button
                  className="home-recommendation-button"
                  onClick={() => navigate("/intelligence")}
                >
                  Full Intelligence Dashboard <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </div>

          {/* ── Row 2: Recent Alerts ── */}
          <div className="home-scrollable-section">
            <div className="home-grid-row-2">
              <section className="home-section">
                <div className="home-section-header">
                  <h2 className="home-section-title">Recent Alerts</h2>
                  <Link to="/alerts" className="home-section-link">View All</Link>
                </div>

                <div className="home-alerts-list">
                  {alerts.filter((a) => !a.resolved).length === 0 ? (
                    <div className="home-alerts-empty">
                      <Bell size={18} className="home-alerts-empty-icon" />
                      No active alerts — your fields look great!
                    </div>
                  ) : (
                    alerts
                      .filter((a) => !a.resolved)
                      .slice(0, 4)
                      .map((alert) => <HomeAlertItem key={alert.id} alert={alert} />)
                  )}

                  {alerts.filter((a) => !a.resolved).length > 0 && (
                    <button
                      className="home-alerts-view-all-btn"
                      onClick={() => navigate("/alerts")}
                    >
                      View All Alerts <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
