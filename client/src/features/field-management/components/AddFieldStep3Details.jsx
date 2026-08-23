import React, { useState } from "react";
import { ArrowLeft, Leaf, Calendar, Droplet, MapPin, Check, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cropApi } from "../../crop-context/api/cropApi";

import "./AddFieldStep.css";

export const AddFieldStep3Details = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read all data passed from Step 2
  const lat = parseFloat(searchParams.get("lat") || "29.731");
  const lng = parseFloat(searchParams.get("lng") || "78.265");
  const address = searchParams.get("address") || "";
  const area = parseFloat(searchParams.get("area") || "0");
  const boundaryRaw = searchParams.get("boundary");

  const [formData, setFormData] = useState({
    name: "",
    crop: "wheat",
    variety: "",
    date: new Date().toISOString().split("T")[0],
    irrigation: "Tube Well",
    soilType: "Loam",
    previousCrop: "",
    tillageMethod: "Conventional",
    seedRate: "",
    targetYield: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const goBack = () => {
    // Re-pass all params except details form
    const params = new URLSearchParams({
      lat,
      lng,
      address,
      area,
      ...(boundaryRaw ? { boundary: boundaryRaw } : {}),
    });
    navigate(`/fields/add/boundary?${params.toString()}`);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Field name is required.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      // Reconstruct boundary GeoJSON from URL param
      let geojson = null;
      if (boundaryRaw) {
        const ring = JSON.parse(boundaryRaw);
        if (ring.length >= 4) {
          geojson = {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [ring] },
            properties: {},
          };
        }
      }

      const newField = await cropApi.createField({
        name: formData.name,
        cropType: formData.crop,
        sowingDate: formData.date,
        cropVariety: formData.variety,
        lat,
        lng,
        locationName: address,
        areaHectares: area || 0,
        boundaryGeojson: geojson,
        irrigationType: formData.irrigation,
        soilType: formData.soilType,
        previousCrop: formData.previousCrop,
        tillageMethod: formData.tillageMethod,
        seedRate: formData.seedRate,
        targetYield: formData.targetYield,
        description: formData.description,
      });

      navigate(newField?.id ? `/fields/${newField.id}` : "/fields", { replace: true });
    } catch (err) {
      console.error("Failed to create field:", err);
      setError("Failed to save field. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-field-page">
      {/* Top bar */}
      <div className="add-field-topbar">
        <button className="add-field-back-btn" onClick={goBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="add-field-title">Field Details</h1>
        <span className="add-field-step-pill">Step 3 of 3</span>
      </div>

      {/* Progress bar */}
      <div className="add-field-progress">
        <div className="add-field-progress-fill" style={{ width: "100%" }} />
      </div>

      {/* Body — scrollable form */}
      <div className="add-field-body">
        <div className="add-field-form-scroll">

          {/* Location summary strip */}
          <div className="add-field-location-strip" style={{ marginBottom: "1rem" }}>
            <MapPin size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <span className="add-field-location-name">{address || "No location selected"}</span>
            {area > 0 && (
              <span className="add-field-location-coords">{area} ha</span>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "0.625rem", padding: "0.65rem 1rem", fontSize: "0.875rem",
              color: "var(--danger)", marginBottom: "1rem", fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Form grid */}
          <div className="add-field-form-grid">

            {/* Field Name */}
            <div className="add-field-form-group full">
              <label className="add-field-form-label">
                Field Name <span className="add-field-form-required">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Main Plot, North Field…"
                className="add-field-form-input"
                value={formData.name}
                onChange={(e) => set("name", e.target.value)}
                autoFocus
              />
            </div>

            {/* Crop Type */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">
                Crop Type <span className="add-field-form-required">*</span>
              </label>
              <div className="add-field-icon-input-wrap">
                <Leaf size={16} className="add-field-input-icon" style={{ color: "#16a34a" }} />
                <select
                  className="add-field-form-select"
                  value={formData.crop}
                  onChange={(e) => set("crop", e.target.value)}
                >
                  <option value="wheat">🌾 Wheat</option>
                  <option value="rice">🍚 Rice</option>
                  <option value="cotton">🪡 Cotton</option>
                  <option value="maize">🌽 Maize</option>
                  <option value="moong">🫘 Moong</option>
                  <option value="groundnut">🥜 Groundnut</option>
                  <option value="sugarcane">🎋 Sugarcane</option>
                  <option value="soybean">🫘 Soybean</option>
                  <option value="tomato">🍅 Tomato</option>
                  <option value="chili">🌶️ Chili</option>
                  <option value="onion">🧅 Onion</option>
                  <option value="potato">🥔 Potato</option>
                </select>
              </div>
            </div>

            {/* Variety */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">
                Variety / Hybrid <span className="add-field-form-optional">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. HD-2967, Pusa Basmati…"
                className="add-field-form-input"
                value={formData.variety}
                onChange={(e) => set("variety", e.target.value)}
              />
            </div>

            {/* Sowing Date */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">
                Sowing Date <span className="add-field-form-required">*</span>
              </label>
              <div className="add-field-icon-input-wrap">
                <Calendar size={16} className="add-field-input-icon" />
                <input
                  type="date"
                  className="add-field-form-input"
                  value={formData.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
            </div>

            {/* Irrigation */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Irrigation Source</label>
              <div className="add-field-icon-input-wrap">
                <Droplet size={16} className="add-field-input-icon" style={{ color: "#3b82f6" }} />
                <select
                  className="add-field-form-select"
                  value={formData.irrigation}
                  onChange={(e) => set("irrigation", e.target.value)}
                >
                  <option value="Tube Well">Tube Well</option>
                  <option value="Borewell">Borewell</option>
                  <option value="Canal">Canal</option>
                  <option value="Well">Well</option>
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Rainfed">Rainfed (no irrigation)</option>
                </select>
              </div>
            </div>

            {/* Area (read-only from boundary step) */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Calculated Area</label>
              <input
                type="text"
                className="add-field-form-input"
                value={area > 0 ? `${area} hectares` : "Not drawn yet"}
                disabled
              />
            </div>

            {/* Soil Type */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Soil Type</label>
              <select
                className="add-field-form-select"
                value={formData.soilType}
                onChange={(e) => set("soilType", e.target.value)}
              >
                <option value="Loam">Loam</option>
                <option value="Clay">Clay</option>
                <option value="Sandy">Sandy</option>
                <option value="Silt">Silt</option>
                <option value="Peat">Peat</option>
                <option value="Chalk">Chalk</option>
              </select>
            </div>

            {/* Previous Crop */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Previous Crop</label>
              <input
                type="text"
                placeholder="e.g. Wheat, Mustard..."
                className="add-field-form-input"
                value={formData.previousCrop}
                onChange={(e) => set("previousCrop", e.target.value)}
              />
            </div>

            {/* Tillage Method */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Tillage Method</label>
              <select
                className="add-field-form-select"
                value={formData.tillageMethod}
                onChange={(e) => set("tillageMethod", e.target.value)}
              >
                <option value="Conventional">Conventional Till</option>
                <option value="Minimum Till">Minimum Till</option>
                <option value="No-till">No-till</option>
                <option value="Strip Till">Strip Till</option>
              </select>
            </div>

            {/* Seed Rate */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Seed Rate</label>
              <input
                type="text"
                placeholder="e.g. 100 kg/ha"
                className="add-field-form-input"
                value={formData.seedRate}
                onChange={(e) => set("seedRate", e.target.value)}
              />
            </div>

            {/* Target Yield */}
            <div className="add-field-form-group">
              <label className="add-field-form-label">Target Yield</label>
              <input
                type="text"
                placeholder="e.g. 5 tons/ha"
                className="add-field-form-input"
                value={formData.targetYield}
                onChange={(e) => set("targetYield", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="add-field-form-group full">
              <label className="add-field-form-label">
                Description <span className="add-field-form-optional">(optional)</span>
              </label>
              <textarea
                placeholder="Any notes about this field…"
                className="add-field-form-textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="add-field-actions">
        <button className="add-field-btn-outline" onClick={goBack} disabled={isSubmitting}>
          ← Back
        </button>
        <button
          className="add-field-btn-solid"
          onClick={handleSave}
          disabled={!formData.name.trim() || !formData.date || isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : (
            <><Check size={16} /> Save Field</>
          )}
        </button>
      </div>
    </div>
  );
};
