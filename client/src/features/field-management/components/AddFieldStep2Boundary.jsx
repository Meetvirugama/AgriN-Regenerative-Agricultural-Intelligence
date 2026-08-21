import React, { useState, useRef, useCallback } from "react";
import { ArrowLeft, PenTool, Check, Undo2, X, Trash2, MousePointer2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Polygon } from "@react-google-maps/api";

import "./AddFieldStep.css";

const libraries = ["places", "geometry"];
const mapContainerStyle = { width: "100%", height: "100%" };

export const AddFieldStep2Boundary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read location passed from Step 1
  const lat = parseFloat(searchParams.get("lat") || "29.731");
  const lng = parseFloat(searchParams.get("lng") || "78.265");
  const address = searchParams.get("address") || "Madhopur, Uttar Pradesh, India";
  
  // Also read boundary and area if navigating back from Step 3
  const initialArea = parseFloat(searchParams.get("area") || "0");
  const boundaryRaw = searchParams.get("boundary");
  let initialBoundary = [];
  try {
    if (boundaryRaw) {
      const ring = JSON.parse(boundaryRaw);
      // Remove the closing point that we added in goNext
      if (ring.length > 0 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
        ring.pop();
      }
      initialBoundary = ring.map(coord => ({ lng: coord[0], lat: coord[1] }));
    }
  } catch (e) {
    console.warn("Failed to parse initial boundary", e);
  }

  const [mapCenter] = useState({ lat, lng });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const [boundaryCoords, setBoundaryCoords] = useState(initialBoundary);
  const [areaHectares, setAreaHectares] = useState(initialArea);

  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onMapUnmount = useCallback(() => { mapRef.current = null; }, []);

  const onMapClick = (e) => {
    if (!isDrawingMode) return;
    setDraftPoints((prev) => [...prev, { lat: e.latLng.lat(), lng: e.latLng.lng() }]);
  };

  const startDrawing = () => {
    setBoundaryCoords([]);
    setDraftPoints([]);
    setAreaHectares(0);
    setIsDrawingMode(true);
  };

  const undoLastPoint = () => setDraftPoints((prev) => prev.slice(0, -1));

  const cancelDrawing = () => {
    setIsDrawingMode(false);
    setDraftPoints([]);
  };

  const finishDrawing = () => {
    if (draftPoints.length < 3) {
      alert("Click at least 3 points to form a field boundary.");
      return;
    }
    setBoundaryCoords(draftPoints);
    if (window.google?.maps?.geometry) {
      const latLngs = draftPoints.map((p) => new window.google.maps.LatLng(p.lat, p.lng));
      const sqMeters = window.google.maps.geometry.spherical.computeArea(
        new window.google.maps.MVCArray(latLngs)
      );
      setAreaHectares((sqMeters / 10000).toFixed(2));
    }
    setIsDrawingMode(false);
    setDraftPoints([]);
  };

  const clearBoundary = () => {
    setBoundaryCoords([]);
    setDraftPoints([]);
    setAreaHectares(0);
    setIsDrawingMode(false);
  };

  const goNext = () => {
    // Encode boundary as JSON string in URL param
    const ring = boundaryCoords.map((c) => [c.lng, c.lat]);
    if (ring.length > 0) ring.push([boundaryCoords[0].lng, boundaryCoords[0].lat]);

    const params = new URLSearchParams({
      lat,
      lng,
      address,
      area: areaHectares,
      boundary: JSON.stringify(ring),
    });
    navigate(`/fields/add/details?${params.toString()}`);
  };

  const goBack = () => {
    const params = new URLSearchParams({ lat, lng, address });
    navigate(`/fields/add/location?${params.toString()}`);
  };

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (loadError) return (
    <div style={{ padding: "2rem", color: "var(--danger)" }}>Maps failed to load.</div>
  );
  if (!isLoaded) return (
    <div style={{ padding: "2rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #16a34a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      Loading Maps…
    </div>
  );

  return (
    <div className="add-field-page">
      {/* Top bar */}
      <div className="add-field-topbar">
        <button className="add-field-back-btn" onClick={goBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="add-field-title">Draw Field Boundary</h1>
        <span className="add-field-step-pill">Step 2 of 3</span>
      </div>

      {/* Progress bar */}
      <div className="add-field-progress">
        <div className="add-field-progress-fill" style={{ width: "66%" }} />
      </div>

      {/* Body */}
      <div className="add-field-body">
        {/* Drawing toolbar */}
        <div className="add-field-draw-toolbar">
          {!isDrawingMode && boundaryCoords.length === 0 && (
            <button className="add-field-draw-btn primary" onClick={startDrawing}>
              <PenTool size={15} /> Start Drawing
            </button>
          )}

          {isDrawingMode && (
            <>
              <span className="add-field-draw-status">
                <MousePointer2 size={15} /> Drawing… ({draftPoints.length} pts)
              </span>
              <button
                className="add-field-draw-btn"
                onClick={undoLastPoint}
                disabled={draftPoints.length === 0}
              >
                <Undo2 size={15} /> Undo
              </button>
              <button
                className="add-field-draw-btn success"
                onClick={finishDrawing}
                disabled={draftPoints.length < 3}
              >
                <Check size={15} /> Finish
              </button>
              <button className="add-field-draw-btn danger" onClick={cancelDrawing}>
                <X size={15} /> Cancel
              </button>
            </>
          )}

          {boundaryCoords.length > 0 && !isDrawingMode && (
            <>
              <span className="add-field-draw-status">
                <Check size={15} /> Boundary set — {areaHectares} ha
              </span>
              <button className="add-field-draw-btn danger" onClick={clearBoundary}>
                <Trash2 size={15} /> Clear & Redraw
              </button>
            </>
          )}
        </div>

        {/* Map — fills remaining space */}
        <div
          className="add-field-map-wrap"
          style={{ cursor: isDrawingMode ? "crosshair" : "default" }}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={17}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={onMapClick}
            options={{
              mapTypeId: "satellite",
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {/* Draft polygon while drawing */}
            {draftPoints.length >= 3 && (
              <Polygon
                paths={draftPoints}
                options={{
                  fillColor: "#22c55e",
                  fillOpacity: 0.15,
                  strokeColor: "#22c55e",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            )}
            {/* Finalized polygon */}
            {boundaryCoords.length > 0 && (
              <Polygon
                paths={boundaryCoords}
                options={{
                  fillColor: "#22c55e",
                  fillOpacity: 0.35,
                  strokeColor: "#16a34a",
                  strokeOpacity: 1,
                  strokeWeight: 2.5,
                }}
              />
            )}
          </GoogleMap>

          {/* Area stat overlay */}
          {(areaHectares > 0 || isDrawingMode) && (
            <div className="add-field-map-stat">
              <div className="add-field-map-stat-label">Field Area</div>
              <div className="add-field-map-stat-value">
                {areaHectares > 0 ? `${areaHectares} ha` : `${draftPoints.length} pts`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="add-field-actions">
        <button className="add-field-btn-outline" onClick={goBack}>← Back</button>
        <button className="add-field-btn-solid" onClick={goNext}>
          {boundaryCoords.length === 0 ? "Skip — Add Details →" : "Next — Add Details →"}
        </button>
      </div>
    </div>
  );
};
