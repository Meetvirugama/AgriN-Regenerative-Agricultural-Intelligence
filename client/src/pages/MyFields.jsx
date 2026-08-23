import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  MoreVertical,
  LayoutGrid,
  List,
  ChevronDown,
  Droplet,
  Activity,
  Loader2,
  MapPin,
  Sprout,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "../components/animations/AnimationKit";

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
  const [filterMode, setFilterMode] = useState("all");
  const [sortMode, setSortMode] = useState("recent");

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
        const sortedData = (data || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setFields(sortedData.map(decorateField));
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

  const uniqueCrops = React.useMemo(() => {
    const crops = new Set(fields.map((f) => f.crop_type).filter(Boolean));
    return Array.from(crops).sort();
  }, [fields]);

  const displayedFields = React.useMemo(() => {
    let result = [...fields];
    if (filterMode !== "all") {
      result = result.filter((f) => f.crop_type === filterMode);
    }
    if (sortMode === "recent") {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortMode === "oldest") {
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortMode === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortMode === "area") {
      result.sort((a, b) => parseFloat(b.area_hectares || 0) - parseFloat(a.area_hectares || 0));
    }
    return result;
  }, [fields, filterMode, sortMode]);

  return (
    <div className="myfields-container">

      {/* HEADER */}
      <FadeIn direction="up" className="myfields-header">
        <div className="myfields-header-content">
          <h1 className="myfields-title">My Fields</h1>
          <p className="myfields-subtitle">
            Manage your registered plots, crop health, and growth stages.
          </p>
        </div>
        <button
          onClick={() => navigate("/fields/add")}
          className="myfields-add-btn"
        >
          <Plus size={18} /> Add New Field
        </button>
      </FadeIn>

      {/* FILTER & SORT TOOLBAR */}
      {fields.length > 0 && (
        <FadeIn direction="up" delay={0.08} className="myfields-controls-bar">
          <div className="myfields-controls-left">
            {/* Filter Pills */}
            <div className="myfields-filter-pills">
              <button
                onClick={() => setFilterMode("all")}
                className={`myfields-pill ${filterMode === "all" ? "active" : ""}`}
              >
                All Fields ({fields.length})
              </button>
              {uniqueCrops.map((crop) => (
                <button
                  key={crop}
                  onClick={() => setFilterMode(crop)}
                  className={`myfields-pill ${filterMode === crop ? "active" : ""}`}
                >
                  {CROP_EMOJI[crop?.toLowerCase()] || "🌿"} {crop.charAt(0).toUpperCase() + crop.slice(1)} (
                  {fields.filter((f) => f.crop_type === crop).length})
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="myfields-sort-wrapper">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="myfields-sort-select"
              >
                <option value="recent">Sort by: Recently Added</option>
                <option value="oldest">Sort by: Oldest First</option>
                <option value="name">Sort by: Name (A-Z)</option>
                <option value="area">Sort by: Area</option>
              </select>
              <ChevronDown size={16} className="myfields-filter-icon" />
            </div>
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
        </FadeIn>
      )}

      {/* CONTENT */}
      {isLoading ? (
        <div className="myfields-loader-container">
          <Loader2 className="myfields-spinner" />
        </div>
      ) : displayedFields.length === 0 ? (
        <EmptyState onAdd={() => navigate("/fields/add")} />
      ) : (
        <StaggerContainer className="myfields-grid" data-view={viewMode}>
          {displayedFields.map((field) => (
            <StaggerItem key={field.id}>
              <motion.div 
                className="myfields-card"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
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
              </motion.div>
            </StaggerItem>
          ))}

          {/* Add New Field Card */}
          <StaggerItem>
            <motion.div 
              className="myfields-add-card" 
              onClick={() => navigate("/fields/add")}
              whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={36} className="myfields-add-icon" />
              <span className="myfields-add-text">Add New Field</span>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      )}

    </div>
  );
};
