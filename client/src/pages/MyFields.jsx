import React, { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./MyFields.css";

export const MyFields = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateAgeDays = (sowingDate) => {
    if (!sowingDate) return 0;
    const sowing = new Date(sowingDate);
    const today = new Date();
    const diffTime = Math.abs(today - sowing);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const data = await cropApi.getAllFields();
        const decoratedFields = (data || []).map((field) => {
          const ageDays = calculateAgeDays(field.sowing_date);
          return {
            ...field,
            variety: field.crop_variety || "Standard",
            area: field.area_hectares ? `${field.area_hectares} ha` : "1.0 ha",
            age: `Day ${ageDays}`,
            status: "good",
            growthStage: getGrowthStage(field.crop_type, ageDays),
            irrigation: "Optimal",
            lastRain: "Noted recently",
            health: "85%",
            image: field.crop_type?.toLowerCase() === "wheat" 
              ? "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=200&fit=crop"
              : field.crop_type?.toLowerCase() === "rice"
              ? "https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=400&h=200&fit=crop"
              : "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=400&h=200&fit=crop"
          };
        });
        
        setFields(decoratedFields);
      } catch (err) {
        console.error("Failed to fetch fields:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFields();
  }, []);

  return (
    <div className="myfields-container">
      
      {/* HEADER */}
      <div className="myfields-header">
        <div>
          <h1 className="myfields-title">My Fields</h1>
          <p className="myfields-subtitle">Manage and monitor all your fields from here.</p>
        </div>
        <div className="myfields-header-actions">
          <button 
            onClick={() => navigate('/fields/add')}
            className="myfields-btn-primary"
          >
            <Plus size={18} strokeWidth={2.5} /> Add New Field
          </button>
        </div>
      </div>

      {/* CONTROLS ROW */}
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

      {/* FIELD CARDS GRID */}
      {isLoading ? (
        <div className="myfields-loader-container">
          <Loader2 className="myfields-spinner" />
        </div>
      ) : (
        <div className="myfields-grid">
          {fields.map((field) => (
            <div key={field.id} className="myfields-card">
              <div className="myfields-card-header">
                <div className="myfields-card-image-wrapper">
                  <img src={field.image} alt={field.name} className="myfields-card-image" />
                </div>
                <div className="myfields-card-header-content">
                  <div className="myfields-card-title-row">
                    <h3 className="myfields-card-title">{field.name}</h3>
                    <button className="myfields-card-menu-btn">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  <div className="myfields-card-meta">
                    {field.crop_type} • {field.variety}<br/>
                    {field.area} • {field.age}
                  </div>
                  <div>
                    <span className={`myfields-card-badge ${field.status}`}>
                      {field.status.charAt(0).toUpperCase() + field.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="myfields-card-body">
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <Leaf size={16} className="myfields-card-icon" /> Growth Stage
                  </span>
                  <span className="myfields-card-value green">{field.growthStage}</span>
                </div>
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <Droplet size={16} className="myfields-card-icon" /> Irrigation
                  </span>
                  <span className="myfields-card-value">{field.irrigation}</span>
                </div>
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <CloudRain size={16} className="myfields-card-icon" /> Last Rain
                  </span>
                  <span className="myfields-card-value">{field.lastRain}</span>
                </div>
                <div className="myfields-card-row">
                  <span className="myfields-card-label">
                    <Activity size={16} className="myfields-card-icon" /> Field Health
                  </span>
                  <span className={`myfields-card-value ${field.status === 'moderate' ? 'orange' : 'green'}`}>{field.health}</span>
                </div>
              </div>
              
              <button 
                className="myfields-card-action-btn"
                onClick={() => navigate(`/fields/${field.id}`)}
              >
                View Field
              </button>
            </div>
          ))}

          {/* Add New Field Card */}
          <div className="myfields-add-card" onClick={() => navigate('/fields/add')}>
            <Plus size={36} className="myfields-add-icon" />
            <span className="myfields-add-text">Add New Field</span>
          </div>
        </div>
      )}

      {/* Bottom Banner */}
      <div className="myfields-bottom-banner">
        <div className="myfields-banner-content">
          <div className="myfields-banner-icon-area">
            🏞️
          </div>
          <div className="myfields-banner-text-group">
            <h3 className="myfields-banner-title">Add more fields to get better insights</h3>
            <p className="myfields-banner-desc">The more fields you add, the smarter AgriMesh becomes.</p>
          </div>
        </div>
        <button onClick={() => navigate('/fields/add')} className="myfields-banner-btn">
          Add New Field
        </button>
      </div>

    </div>
  );
};
