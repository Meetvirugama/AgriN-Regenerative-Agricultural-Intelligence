import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  MoreVertical,
  LayoutGrid,
  List,
  ChevronDown,
  Leaf,
  Droplet,
  CloudRain,
  Activity,
  Loader2,
  MapPin,
  Sprout,
  Trash2,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./MyFields.css";

// ── Crop config ────────────────────────────────────────────────────────────
const CROP_EMOJI = {
  wheat: "🌾", rice: "🍚", cotton: "🪡", maize: "🌽",
  moong: "🫘", groundnut: "🥜", sugarcane: "🎋", soybean: "🫘",
  tomato: "🍅", chili: "🌶️", onion: "🧅", potato: "🥔",
};

const CROP_IMAGE = {
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=200&fit=crop",
  rice: "https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=400&h=200&fit=crop",
  cotton: "https://images.unsplash.com/photo-1567851200723-9f57fc9bdabb?w=400&h=200&fit=crop",
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=200&fit=crop",
};
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=400&h=200&fit=crop";

// ── Growth stage logic ─────────────────────────────────────────────────────
const calculateAgeDays = (sowingDate) => {
  if (!sowingDate) return 0;
  const diff = Date.now() - new Date(sowingDate).getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
};

const getGrowthStage = (cropType, ageDays) => {
  const crop = (cropType || "").toLowerCase();
  if (crop === "wheat") {
    if (ageDays < 20) return "Germination";
    if (ageDays < 45) return "Tillering";
    if (ageDays < 80) return "Flowering";
    return "Ripening";
  }
  if (crop === "rice") {
    if (ageDays < 25) return "Seedling";
    if (ageDays < 55) return "Tillering";
    if (ageDays < 90) return "Flowering";
    return "Maturation";
  }
  if (ageDays < 30) return "Vegetative";
  if (ageDays < 60) return "Flowering";
  return "Maturity";
};

// ── Card menu ─────────────────────────────────────────────────────────────
const CardMenu = ({ fieldId, fieldName, onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await cropApi.deleteField(fieldId);
      onDeleted(fieldId);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
      setOpen(false);
      setConfirming(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="myfields-card-menu-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); setConfirming(false); }}
        aria-label="Field options"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="myfields-dropdown">
          {!confirming ? (
            <>
              <button
                className="myfields-dropdown-item danger"
                onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              >
                <Trash2 size={14} /> Delete Field
              </button>
            </>
          ) : (
            <div className="myfields-dropdown-confirm">
              <p>Delete <strong>{fieldName}</strong>? This cannot be undone.</p>
              <div className="myfields-dropdown-confirm-actions">
                <button
                  className="myfields-dropdown-item danger"
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  className="myfields-dropdown-item"
                  onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <div className="myfields-empty">
    <div className="myfields-empty-icon">🌱</div>
    <h2 className="myfields-empty-title">No fields yet</h2>
    <p className="myfields-empty-desc">
      Add your first field to start getting satellite imagery, weather intelligence, and AI advisory tailored to your exact location.
    </p>
    <button className="myfields-btn-primary" onClick={onAdd}>
      <Plus size={18} strokeWidth={2.5} /> Add Your First Field
    </button>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
export const MyFields = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const decorateField = (field) => {
    const ageDays = calculateAgeDays(field.sowing_date);
    const crop = (field.crop_type || "").toLowerCase();
    return {
      ...field,
      variety: field.crop_variety || "Standard",
      area: field.area_hectares
        ? `${parseFloat(field.area_hectares).toFixed(2)} ha`
        : "—",
      age: `Day ${ageDays}`,
      growthStage: getGrowthStage(field.crop_type, ageDays),
      cropEmoji: CROP_EMOJI[crop] || "🌿",
      image: CROP_IMAGE[crop] || DEFAULT_IMAGE,
      irrigationLabel: field.irrigation_type || "—",
      locationLabel: field.location_name
        ? field.location_name.split(",").slice(0, 2).join(", ")
        : "—",
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await cropApi.getAllFields();
        setFields((data || []).map(decorateField));
      } catch (err) {
        console.error("Failed to fetch fields:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleFieldDeleted = (deletedId) => {
    setFields((prev) => prev.filter((f) => f.id !== deletedId));
  };

  return (
    <div className="myfields-container">

      {/* HEADER */}
      <div className="myfields-header">
        <div>
          <h1 className="myfields-title">My Fields</h1>
          <p className="myfields-subtitle">
            {fields.length > 0
              ? `${fields.length} field${fields.length !== 1 ? "s" : ""} registered`
              : "Manage and monitor all your fields from here."}
          </p>
        </div>
        <div className="myfields-header-actions">
          <button
            onClick={() => navigate("/fields/add")}
            className="myfields-btn-primary"
          >
            <Plus size={18} strokeWidth={2.5} /> Add New Field
          </button>
        </div>
      </div>

      {/* CONTROLS ROW */}
      {fields.length > 0 && (
        <div className="myfields-controls">
          <div className="myfields-filters">
            <button className="myfields-filter-btn">
              All Fields <ChevronDown size={16} className="myfields-filter-icon" />
            </button>
            <button className="myfields-filter-btn">
              Sort by: Recent <ChevronDown size={16} className="myfields-filter-icon" />
            </button>
          </div>
          <div className="myfields-controls-right">
            <div className="myfields-view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`myfields-view-btn ${viewMode === "grid" ? "active" : "inactive"}`}
              >
                <LayoutGrid size={18} />
              </button>
              <div className="myfields-view-divider"></div>
              <button
                onClick={() => setViewMode("list")}
                className={`myfields-view-btn ${viewMode === "list" ? "active" : "inactive"}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {isLoading ? (
        <div className="myfields-loader-container">
          <Loader2 className="myfields-spinner" />
        </div>
      ) : fields.length === 0 ? (
        <EmptyState onAdd={() => navigate("/fields/add")} />
      ) : (
        <div className="myfields-grid">
          {fields.map((field) => (
            <div key={field.id} className="myfields-card">
              <div className="myfields-card-header">
                <div className="myfields-card-image-wrapper">
                  <img src={field.image} alt={field.name} className="myfields-card-image" />
                  <span className="myfields-card-crop-badge">{field.cropEmoji}</span>
                </div>
                <div className="myfields-card-header-content">
                  <div className="myfields-card-title-row">
                    <h3 className="myfields-card-title">{field.name}</h3>
                    <CardMenu
                      fieldId={field.id}
                      fieldName={field.name}
                      onDeleted={handleFieldDeleted}
                    />
                  </div>
                  <div className="myfields-card-meta">
                    {field.cropEmoji} {field.crop_type
                      ? field.crop_type.charAt(0).toUpperCase() + field.crop_type.slice(1)
                      : "—"}
                    {field.variety !== "Standard" ? ` • ${field.variety}` : ""}
                  </div>
                  <div className="myfields-card-sub-meta">
                    {field.area} • {field.age}
                  </div>
                  {field.locationLabel && field.locationLabel !== "—" && (
                    <div className="myfields-card-location">
                      <MapPin size={12} /> {field.locationLabel}
                    </div>
                  )}
                </div>
              </div>

              <div className="myfields-card-body">
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <Sprout size={16} className="myfields-card-icon" /> Growth Stage
                  </span>
                  <span className="myfields-card-value green">{field.growthStage}</span>
                </div>
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <Droplet size={16} className="myfields-card-icon" /> Irrigation
                  </span>
                  <span className="myfields-card-value">{field.irrigationLabel}</span>
                </div>
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <Activity size={16} className="myfields-card-icon" /> Field Health
                  </span>
                  <span className="myfields-card-value green">Active</span>
                </div>
              </div>

              <button
                className="myfields-card-action-btn"
                onClick={() => navigate(`/fields/${field.id}`)}
              >
                <ExternalLink size={14} /> View Field Dashboard
              </button>
            </div>
          ))}

          {/* Add New Field Card */}
          <div className="myfields-add-card" onClick={() => navigate("/fields/add")}>
            <Plus size={36} className="myfields-add-icon" />
            <span className="myfields-add-text">Add New Field</span>
          </div>
        </div>
      )}

      {/* Bottom Banner — only when fields exist */}
      {!isLoading && fields.length > 0 && (
        <div className="myfields-bottom-banner">
          <div className="myfields-banner-content">
            <div className="myfields-banner-icon-area">🏞️</div>
            <div className="myfields-banner-text-group">
              <h3 className="myfields-banner-title">Add more fields to get better insights</h3>
              <p className="myfields-banner-desc">The more fields you add, the smarter AgriMesh becomes.</p>
            </div>
          </div>
          <button onClick={() => navigate("/fields/add")} className="myfields-banner-btn">
            Add New Field
          </button>
        </div>
      )}
    </div>
  );
};
