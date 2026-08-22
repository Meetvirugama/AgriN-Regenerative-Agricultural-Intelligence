import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  ArrowLeft, PenTool, Check, Undo2, X, Trash2, MousePointer2, 
  Info, Move, Sparkles, CheckCircle2, RotateCcw
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Polygon, Polyline, MarkerF, OverlayViewF } from "@react-google-maps/api";

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
      // Remove the closing point if duplicated
      if (ring.length > 0 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
        ring.pop();
      }
      initialBoundary = ring.map(coord => ({ lng: coord[0], lat: coord[1] }));
    }
  } catch (e) {
    console.warn("Failed to parse initial boundary", e);
  }

  const [mapCenter] = useState({ lat, lng });
  const [isDrawingMode, setIsDrawingMode] = useState(initialBoundary.length === 0);
  const [draftPoints, setDraftPoints] = useState(initialBoundary.length === 0 ? [] : []);
  const [boundaryCoords, setBoundaryCoords] = useState(initialBoundary);
  const [areaHectares, setAreaHectares] = useState(initialArea);
  const [isEditable, setIsEditable] = useState(true);

  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const pathListenersRef = useRef([]);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onMapUnmount = useCallback(() => { mapRef.current = null; }, []);

  // Recalculate area given an array of {lat, lng} coordinates
  const calculateArea = useCallback((coords) => {
    if (!coords || coords.length < 3 || !window.google?.maps?.geometry?.spherical) {
      return 0;
    }
    const latLngs = coords.map((p) => new window.google.maps.LatLng(p.lat, p.lng));
    const sqMeters = window.google.maps.geometry.spherical.computeArea(
      new window.google.maps.MVCArray(latLngs)
    );
    const ha = (sqMeters / 10000).toFixed(2);
    setAreaHectares(ha);
    return ha;
  }, []);

  // Map Click Handler: Add point or close loop if clicking close to first point
  const onMapClick = (e) => {
    if (!isDrawingMode) return;
    const clickedLat = e.latLng.lat();
    const clickedLng = e.latLng.lng();

    // If user has 3+ points and clicks close to the starting point (within ~20m), close boundary
    if (draftPoints.length >= 3 && window.google?.maps?.geometry?.spherical) {
      const firstPt = new window.google.maps.LatLng(draftPoints[0].lat, draftPoints[0].lng);
      const currentPt = new window.google.maps.LatLng(clickedLat, clickedLng);
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(firstPt, currentPt);
      
      if (distance <= 30) {
        // Snapped to first point -> close polygon
        finalizeDraftBoundary(draftPoints);
        return;
      }
    }

    setDraftPoints((prev) => [...prev, { lat: clickedLat, lng: clickedLng }]);
  };

  const startDrawing = () => {
    setBoundaryCoords([]);
    setDraftPoints([]);
    setAreaHectares(0);
    setIsDrawingMode(true);
    setIsEditable(true);
  };

  const undoLastPoint = () => setDraftPoints((prev) => prev.slice(0, -1));

  const cancelDrawing = () => {
    setIsDrawingMode(false);
    setDraftPoints([]);
  };

  const finalizeDraftBoundary = (pointsToFinalize) => {
    const pts = pointsToFinalize || draftPoints;
    if (pts.length < 3) {
      alert("Please mark at least 3 points around your parcel to form a field.");
      return;
    }
    setBoundaryCoords(pts);
    calculateArea(pts);
    setIsDrawingMode(false);
    setDraftPoints([]);
    setIsEditable(true);
  };

  const clearBoundary = () => {
    setBoundaryCoords([]);
    setDraftPoints([]);
    setAreaHectares(0);
    setIsDrawingMode(false);
  };

  // Polygon Load Callback for interactive resizing & dragging vertices
  const onPolygonLoad = useCallback((polygon) => {
    polygonRef.current = polygon;
    const path = polygon.getPath();

    const handlePathUpdate = () => {
      const updated = [];
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        updated.push({ lat: point.lat(), lng: point.lng() });
      }
      setBoundaryCoords(updated);
      calculateArea(updated);
    };

    // Clean up previous listeners
    pathListenersRef.current.forEach((listener) => window.google?.maps?.event?.removeListener(listener));
    
    // Attach listeners for vertex moving, adding, or deleting
    pathListenersRef.current = [
      path.addListener("set_at", handlePathUpdate),
      path.addListener("insert_at", handlePathUpdate),
      path.addListener("remove_at", handlePathUpdate),
    ];
  }, [calculateArea]);

  const onPolygonUnmount = useCallback(() => {
    pathListenersRef.current.forEach((listener) => window.google?.maps?.event?.removeListener(listener));
    pathListenersRef.current = [];
    polygonRef.current = null;
  }, []);

  const goNext = () => {
    // Encode boundary as GeoJSON ring coordinates [lng, lat]
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

  const acres = (areaHectares * 2.47105).toFixed(2);

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
        
        {/* Helper instruction banner */}
        <div className="add-field-instruction-banner">
          <div className="add-field-instruction-icon">
            <Info size={16} />
          </div>
          <div className="add-field-instruction-content">
            {!isDrawingMode && boundaryCoords.length === 0 && (
              <p>
                <strong>Mark your field:</strong> Click <em>"Start Drawing"</em>, then tap along the outer corners of your land parcel on the map.
              </p>
            )}
            {isDrawingMode && draftPoints.length < 3 && (
              <p>
                <strong>Plot corners ({draftPoints.length}/3 min points):</strong> Click around the edges of your field to mark boundary points.
              </p>
            )}
            {isDrawingMode && draftPoints.length >= 3 && (
              <p>
                <strong>Close your field shape:</strong> Click the <span className="add-field-highlight-text">first point (green ring)</span> or click <em>"Finish Shape"</em> to complete your boundary.
              </p>
            )}
            {!isDrawingMode && boundaryCoords.length > 0 && (
              <p>
                <strong>Boundary Set ({areaHectares} ha):</strong> You can <strong>drag the corner handles</strong> on the map to fine-tune or resize the boundary!
              </p>
            )}
          </div>
        </div>

        {/* Drawing toolbar */}
        <div className="add-field-draw-toolbar">
          {!isDrawingMode && boundaryCoords.length === 0 && (
            <button className="add-field-draw-btn primary" onClick={startDrawing}>
              <PenTool size={15} /> Start Drawing Field
            </button>
          )}

          {isDrawingMode && (
            <>
              <span className="add-field-draw-status">
                <MousePointer2 size={15} /> Drawing: {draftPoints.length} points marked
              </span>
              <button
                className="add-field-draw-btn"
                onClick={undoLastPoint}
                disabled={draftPoints.length === 0}
                title="Undo last point"
              >
                <Undo2 size={15} /> Undo Point
              </button>
              <button
                className="add-field-draw-btn success"
                onClick={() => finalizeDraftBoundary(draftPoints)}
                disabled={draftPoints.length < 3}
                title="Finish and close boundary"
              >
                <Check size={15} /> Finish Shape
              </button>
              <button className="add-field-draw-btn danger" onClick={cancelDrawing}>
                <X size={15} /> Cancel
              </button>
            </>
          )}

          {boundaryCoords.length > 0 && !isDrawingMode && (
            <>
              <span className="add-field-draw-status success">
                <CheckCircle2 size={15} /> {boundaryCoords.length} Points • {areaHectares} ha ({acres} acres)
              </span>
              <button 
                className={`add-field-draw-btn ${isEditable ? "active-toggle" : ""}`}
                onClick={() => setIsEditable(!isEditable)}
                title="Toggle vertex drag handles"
              >
                <Move size={14} /> {isEditable ? "Handles Enabled (Drag to Resize)" : "Enable Resize Handles"}
              </button>
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
            {/* 1. WHILE DRAWING: Polyline connecting the draft points in order */}
            {isDrawingMode && draftPoints.length > 0 && (
              <Polyline
                path={draftPoints}
                options={{
                  strokeColor: "#22c55e",
                  strokeOpacity: 0.95,
                  strokeWeight: 3,
                }}
              />
            )}

            {/* 2. WHILE DRAWING: Vertex dot markers on all placed points */}
            {isDrawingMode && draftPoints.map((point, index) => {
              const isFirst = index === 0;
              return (
                <MarkerF
                  key={`draft-pt-${index}-${point.lat}-${point.lng}`}
                  position={point}
                  onClick={() => {
                    if (isFirst && draftPoints.length >= 3) {
                      finalizeDraftBoundary(draftPoints);
                    }
                  }}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    scale: isFirst ? 7 : 5,
                    fillColor: isFirst ? "#10b981" : "#22c55e",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: isFirst ? 3 : 2,
                  }}
                  title={isFirst && draftPoints.length >= 3 ? "Click here to close field boundary!" : `Point ${index + 1}`}
                />
              );
            })}

            {/* 3. FINALIZED / RESIZABLE POLYGON */}
            {boundaryCoords.length > 0 && !isDrawingMode && (
              <Polygon
                paths={boundaryCoords}
                onLoad={onPolygonLoad}
                onUnmount={onPolygonUnmount}
                options={{
                  fillColor: "#22c55e",
                  fillOpacity: 0.32,
                  strokeColor: "#15803d",
                  strokeOpacity: 1,
                  strokeWeight: 3,
                  editable: isEditable, // Enables native Google Maps vertex and midpoint dragging for resizing!
                  draggable: false,
                  zIndex: 2,
                }}
              />
            )}
          </GoogleMap>

          {/* Area & coordinate stats pill overlay */}
          {(areaHectares > 0 || isDrawingMode) && (
            <div className="add-field-map-stat">
              <div className="add-field-map-stat-label">Field Area</div>
              <div className="add-field-map-stat-value">
                {areaHectares > 0 ? `${areaHectares} ha` : `${draftPoints.length} points`}
              </div>
              {areaHectares > 0 && (
                <div className="add-field-map-stat-sub">
                  ≈ {acres} acres • {boundaryCoords.length} vertices
                </div>
              )}
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
