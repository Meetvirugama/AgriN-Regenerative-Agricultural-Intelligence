import React, { useState, useEffect } from "react";
import { Plus, MoreVertical, Loader2, AlertCircle } from "lucide-react";
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

/** Crop thumbnail map — falls back to a generic green crop image */
const CROP_IMAGES = {
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop",
  rice:  "https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop",
};
const FALLBACK_IMG = "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=150&h=150&fit=crop";

const HomeAlertItem = ({ alert }) => {
  const [isHovered, setIsHovered] = useState(false);

  const priorityClass =
    alert.priority === "High" ? "poor" :
    alert.priority === "Medium" ? "moderate" : "good";

  const iconClass =
    alert.priority === "High"   ? "danger" :
    alert.priority === "Medium" ? "warning" : "info";

  const IconComponent =
    alert.priority === "High" || alert.priority === "Medium"
      ? TriangleAlertIcon
      : InfoCircleIcon;

  const formatTime = (isoString) => {
    if (!isoString) return "Just now";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="home-alert-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="home-alert-content">
        <div className={`home-alert-icon ${iconClass}`}>
          <IconComponent size={20} isHovered={isHovered} />
        </div>
        <div className="home-alert-text">
          <h4>{alert.title}</h4>
          <p>{alert.field || "All Fields"}</p>
        </div>
      </div>
      <div className="home-alert-meta">
        <span className={`home-card-badge ${priorityClass}`}>{alert.priority}</span>
        <span className="home-alert-time">{formatTime(alert.createdAt || alert.time)}</span>
      </div>
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const { farmer } = useAuth();
  const [fields, setFields] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isWeatherHovered, setIsWeatherHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(null);
        const [fieldsData, alertsData] = await Promise.all([
          cropApi.getAllFields(),
          cropApi.getAlerts(),
        ]);
        setFields(Array.isArray(fieldsData) ? fieldsData : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setLoadError("Unable to load dashboard data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayFields = fields.map((f) => {
    const cropKey = (f.crop_type || "").toLowerCase();
    const cropDisplay = f.crop_type
      ? f.crop_type.charAt(0).toUpperCase() + f.crop_type.slice(1)
      : "Unknown";
    return {
      id: f.id,
      name: f.name,
      crop_type: cropDisplay,
      subtitle: f.area_hectares
        ? `${cropDisplay} • ${parseFloat(f.area_hectares).toFixed(2)} ha`
        : `${cropDisplay}`,
      status: cropKey === "rice" ? "Moderate" : "Good",
      statusClass: cropKey === "rice" ? "moderate" : "good",
      img: CROP_IMAGES[cropKey] || FALLBACK_IMG,
    };
  });

  const greeting = getGreeting();
  const firstName = farmer?.name ? farmer.name.split(" ")[0] : "Farmer";

  return (
    <div className="home-container">

      {/* ── Page Header ── */}
      <section className="home-header">
        <h1>{greeting}, {firstName}</h1>
        <p>Here's what's happening in your fields today.</p>
      </section>

      {/* ── Load Error Banner ── */}
      {loadError && (
        <div className="home-error-banner">
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── Row 1: Fields + Recommendation ── */}
      <div className="home-grid-row-1">

        {/* Fields */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">My Fields</h2>
            <Link to="/fields" className="home-section-link">View All Fields</Link>
          </div>

          <div className="home-fields-grid">
            {isLoading ? (
              <div className="home-loading-row">
                <Loader2 className="home-spinner" size={28} />
              </div>
            ) : (
              <>
                {displayFields.slice(0, 2).map((field) => (
                  <div key={field.id} className="home-card">
                    <div className="home-card-top-content">
                      <div className="home-card-info-row">
                        <div className="home-card-image">
                          <img src={field.img} alt={field.crop_type} />
                        </div>
                        <div className="home-card-text-container">
                          <div className="home-card-title-row">
                            <h3 className="home-card-title">{field.name}</h3>
                            <button
                              className="home-card-more-btn"
                              aria-label="Field options"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                          <p className="home-card-subtitle">{field.subtitle}</p>
                        </div>
                      </div>
                      <span className={`home-card-badge ${field.statusClass}`}>
                        {field.status}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/fields/${field.id}`)}
                      className="home-card-button"
                    >
                      View Field
                    </button>
                  </div>
                ))}

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/fields/add")}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/fields/add")}
                  className="home-add-field"
                  aria-label="Add new field"
                >
                  <Plus size={28} className="home-add-field-icon" />
                  <span className="home-add-field-label">Add New Field</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Today's Recommendation */}
        <section className="home-section">
          <h2 className="home-section-title">Today's Recommendation</h2>
          <div
            className="home-recommendation-card"
            onMouseEnter={() => setIsWeatherHovered(true)}
            onMouseLeave={() => setIsWeatherHovered(false)}
          >
            <div className="home-recommendation-content">
              <Cloud2Icon
                size={40}
                className="home-recommendation-icon"
                strokeWidth={1.5}
                isHovered={isWeatherHovered}
              />
              <div className="home-recommendation-text">
                {fields.length > 0 ? (
                  <>
                    <h3>Irrigation scheduling active</h3>
                    <p>Keep track of moisture levels.</p>
                    <div className="home-rec-subtext">Field: {fields[0].name}</div>
                  </>
                ) : (
                  <>
                    <h3>No fields added yet</h3>
                    <p>Add a field to get crop weather insights.</p>
                    <div className="home-rec-subtext">Insights ready on field creation</div>
                  </>
                )}
              </div>
            </div>
            <button
              className="home-recommendation-button"
              onClick={() => navigate("/intelligence")}
            >
              View Details
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
              {isLoading ? (
                <div className="home-loading-row home-loading-sm">
                  <Loader2 className="home-spinner" size={22} />
                </div>
              ) : alerts.length === 0 ? (
                <div className="home-alerts-empty">
                  No active alerts for your fields.
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <HomeAlertItem key={alert.id} alert={alert} />
                ))
              )}

              {!isLoading && alerts.length > 0 && (
                <button
                  className="home-alerts-view-all-btn"
                  onClick={() => navigate("/alerts")}
                >
                  View All Alerts
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
