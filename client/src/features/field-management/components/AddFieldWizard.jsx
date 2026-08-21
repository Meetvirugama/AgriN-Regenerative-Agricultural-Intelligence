import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ArrowLeft, Search, Crosshair, MapPin,
  Plus, Minus, Check, MousePointer2, PenTool,
  Trash2, Calendar, Droplet, CloudUpload, 
  BrainCircuit, Leaf, Loader2, X, AlertTriangle, Undo2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Polygon, Autocomplete } from '@react-google-maps/api';
import { cropApi } from "../../crop-context/api/cropApi";

import "./AddFieldWizard.css";

// NOTE: 'drawing' library removed — DrawingManager was removed in Maps JS API v3.65
// We now use a manual click-to-draw approach.
const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

export const AddFieldWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdFieldId, setCreatedFieldId] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries
  });

  // Location State
  const [location, setLocation] = useState({
    lat: 29.7310,
    lng: 78.2650,
    address: "Madhopur, Uttar Pradesh, India"
  });

  // Maps State
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapCenter, setMapCenter] = useState({ lat: 29.7310, lng: 78.2650 });

  // Drawing State — replaces DrawingManager
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]); // points being drawn
  const [boundaryCoords, setBoundaryCoords] = useState([]); // finalized polygon
  const [areaHectares, setAreaHectares] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    crop: "Wheat",
    variety: "",
    date: new Date().toISOString().split('T')[0],
    irrigation: "Tube Well",
    soil: "Loamy Soil",
    description: ""
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setLocation({ lat, lng, address: results[0].formatted_address });
        setMapCenter({ lat, lng });
      } else {
        setLocation({ lat, lng, address: "Unknown Location" });
        setMapCenter({ lat, lng });
      }
    });
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      });
    }
  };

  // Step 1 map click — pin location
  const onStep1MapClick = (e) => {
    reverseGeocode(e.latLng.lat(), e.latLng.lng());
  };

  // Step 2 map click — add polygon vertex when in drawing mode
  const onStep2MapClick = (e) => {
    if (!isDrawingMode) return;
    const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setDraftPoints(prev => [...prev, point]);
  };

  const finishDrawing = () => {
    if (draftPoints.length < 3) {
      alert("Please click at least 3 points to draw a polygon.");
      return;
    }
    const coords = draftPoints;
    setBoundaryCoords(coords);

    if (window.google?.maps?.geometry) {
      const latLngs = coords.map(p => new window.google.maps.LatLng(p.lat, p.lng));
      const path = new window.google.maps.MVCArray(latLngs);
      const sqMeters = window.google.maps.geometry.spherical.computeArea(path);
      setAreaHectares((sqMeters / 10000).toFixed(2));
    }

    setIsDrawingMode(false);
    setDraftPoints([]);
  };

  const undoLastPoint = () => {
    setDraftPoints(prev => prev.slice(0, -1));
  };

  const clearBoundary = () => {
    setBoundaryCoords([]);
    setDraftPoints([]);
    setAreaHectares(0);
    setIsDrawingMode(false);
  };

  const startDrawing = () => {
    setBoundaryCoords([]);
    setDraftPoints([]);
    setAreaHectares(0);
    setIsDrawingMode(true);
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocation({ lat, lng, address: place.formatted_address });
        setMapCenter({ lat, lng });
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const ring = boundaryCoords.map(c => [c.lng, c.lat]);
      if (ring.length > 0) {
        ring.push([boundaryCoords[0].lng, boundaryCoords[0].lat]);
      }
      const geojson = boundaryCoords.length > 0 ? {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ring]
        },
        properties: {}
      } : null;

      const newField = await cropApi.createField({
        name: formData.name,
        cropType: formData.crop,
        sowingDate: formData.date,
        cropVariety: formData.variety,
        lat: location.lat,
        lng: location.lng,
        locationName: location.address,
        areaHectares: parseFloat(areaHectares) || 0,
        boundaryGeojson: geojson,
        irrigationType: formData.irrigation,
      });
      setCreatedFieldId(newField?.id ?? null);
      setStep(4);
    } catch (err) {
      console.error("Failed to create field", err);
      alert("Failed to create field. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) return (
    <div style={{padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--danger)'}}>
      <AlertTriangle size={20} />
      Maps failed to load. Check your API key and that the Maps JavaScript API is enabled.
    </div>
  );
  if (!isLoaded) return (
    <div style={{padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
      <Loader2 className="animate-spin" /> Loading Maps...
    </div>
  );

  return (
    <div className="wizard-container">
      <div className="wizard-content-wrapper">
        
        {/* HEADER */}
        <div className="wizard-header">
          <button 
            onClick={() => step > 1 && step < 4 ? setStep(step - 1) : navigate(-1)}
            className="wizard-back-btn"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="wizard-title">Add New Field</h1>
          {/* Step indicator — compact pill instead of full stepper */}
          {step < 4 && (
            <span className="wizard-step-pill">Step {step} of 3</span>
          )}
        </div>

        {/* STEP 1: LOCATION */}
        {step === 1 && (
          <div className="wizard-step1-layout">
            {/* Search bar */}
            <div className="wizard-search-bar">
              <div className="wizard-search-input-wrapper">
                <Search size={18} className="wizard-search-icon" />
                <Autocomplete
                  onLoad={autocomplete => { autocompleteRef.current = autocomplete; }}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Search location (e.g. Madhopur)..."
                    className="wizard-input wizard-form-input with-icon"
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', paddingLeft: '2.75rem' }}
                  />
                </Autocomplete>
              </div>
              <button className="wizard-target-btn" onClick={useMyLocation} title="Use My Location" style={{ color: 'var(--primary)' }}>
                <Crosshair size={20} />
              </button>
            </div>

            {/* Selected location strip */}
            {location.address && (
              <div className="wizard-location-strip">
                <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span className="wizard-location-strip-name">{location.address}</span>
                <span className="wizard-location-strip-coords">{location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E</span>
              </div>
            )}

            {/* Map — fills remaining space */}
            <div className="wizard-map-wrapper wizard-map-fill" style={{ zIndex: 1 }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={15}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                onClick={onStep1MapClick}
                options={{
                  mapTypeId: 'satellite',
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  mapId: 'AGRIMESH_MAP',
                }}
              >
                <LocationPin position={{ lat: location.lat, lng: location.lng }} map={mapRef.current} />
              </GoogleMap>
            </div>

            {/* Action buttons pinned at bottom */}
            <div className="wizard-actions wizard-actions-bottom">
              <button onClick={() => navigate('/fields')} className="wizard-btn-outline">Cancel</button>
              <button
                id="step1-next-btn"
                onClick={() => setStep(2)}
                className="wizard-btn-solid"
              >
                Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BOUNDARY — manual click-to-draw */}
        {step === 2 && (
          <div className="wizard-step-content cols-4">
            {/* MAIN COLUMN */}
            <div className="wizard-main-col-xl wizard-col-flex tall">
              <div className="wizard-step-header-row">
                <div>
                  <h2 className="wizard-step-title">Step 2: Draw Field Boundary</h2>
                  <p className="wizard-step-subtitle">Click the map to place points around your field boundary</p>
                </div>
                <div className="wizard-inline-info">
                  <Info size={16} /> Click corners → "Finish Drawing"
                </div>
              </div>

              {/* Drawing toolbar */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!isDrawingMode && boundaryCoords.length === 0 && (
                  <button
                    onClick={startDrawing}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
                  >
                    <PenTool size={16} /> Start Drawing
                  </button>
                )}
                {isDrawingMode && (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                      <MousePointer2 size={16} /> Drawing… ({draftPoints.length} pts)
                    </span>
                    <button
                      onClick={undoLastPoint}
                      disabled={draftPoints.length === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', opacity: draftPoints.length === 0 ? 0.4 : 1, fontFamily: 'inherit' }}
                    >
                      <Undo2 size={16} /> Undo
                    </button>
                    <button
                      onClick={finishDrawing}
                      disabled={draftPoints.length < 3}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', opacity: draftPoints.length < 3 ? 0.5 : 1, fontFamily: 'inherit' }}
                    >
                      <Check size={16} /> Finish Drawing
                    </button>
                    <button
                      onClick={clearBoundary}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: '600', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </>
                )}
                {boundaryCoords.length > 0 && (
                  <button
                    onClick={clearBoundary}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: '600', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
                  >
                    <Trash2 size={16} /> Clear & Redraw
                  </button>
                )}
              </div>

              <div
                className="wizard-map-wrapper"
                style={{ zIndex: 1, position: 'relative', cursor: isDrawingMode ? 'crosshair' : 'default' }}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={18}
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  onClick={onStep2MapClick}
                  options={{
                    mapTypeId: 'satellite',
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: false,
                    mapId: 'AGRIMESH_MAP',
                  }}
                >
                  {draftPoints.length >= 3 && (
                    <Polygon
                      paths={draftPoints}
                      options={{ fillColor: '#22c55e', fillOpacity: 0.2, strokeColor: '#22c55e', strokeOpacity: 0.8, strokeWeight: 2 }}
                    />
                  )}
                  {boundaryCoords.length > 0 && (
                    <Polygon
                      paths={boundaryCoords}
                      options={{ fillColor: '#22c55e', fillOpacity: 0.4, strokeColor: '#22c55e', strokeOpacity: 1, strokeWeight: 2 }}
                    />
                  )}
                </GoogleMap>
              </div>
            </div>

            {/* SIDE COLUMN */}
            <div className="wizard-side-col tall">
              <div className="wizard-side-card">
                <p className="wizard-area-label">Field Area</p>
                <h3 className="wizard-area-value">{areaHectares} Hectares</h3>
                <p className="wizard-area-sub">({Math.round(areaHectares * 10000)} m²)</p>

                <div className="wizard-stats-list">
                  <div className="wizard-stat-row">
                    <div className="wizard-stat-label"><MapPin size={16} className="icon" /> Latitude</div>
                    <span className="wizard-stat-value">{location.lat.toFixed(4)}° N</span>
                  </div>
                  <div className="wizard-stat-row">
                    <div className="wizard-stat-label"><MapPin size={16} className="icon" /> Longitude</div>
                    <span className="wizard-stat-value">{location.lng.toFixed(4)}° E</span>
                  </div>
                </div>

                <div className="wizard-success-banner">
                  <h4 className="wizard-success-banner-title">How to draw</h4>
                  <div className="wizard-success-banner-list">
                    <div className="wizard-success-banner-item"><div className="wizard-check-circle"><Check size={12} strokeWidth={3} /></div> Press "Start Drawing"</div>
                    <div className="wizard-success-banner-item"><div className="wizard-check-circle"><Check size={12} strokeWidth={3} /></div> Click each corner of your field</div>
                    <div className="wizard-success-banner-item"><div className="wizard-check-circle"><Check size={12} strokeWidth={3} /></div> Press "Finish Drawing" (min 3 pts)</div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS — always visible */}
              <div className="wizard-actions">
                <button onClick={() => setStep(1)} className="wizard-btn-outline">← Back</button>
                <button id="step2-next-btn" onClick={() => setStep(3)} className="wizard-btn-solid">
                  {boundaryCoords.length === 0 ? 'Skip (draw later)' : 'Next'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <div className="wizard-step-content xl-cols-3">
            <div className="wizard-main-col-xl-2 wizard-col-flex auto">
              <div>
                <h2 className="wizard-step-title">Step 3: Field Details</h2>
                <p className="wizard-step-subtitle">Provide basic information about your field</p>
              </div>

              <div className="wizard-form-grid">
                <div className="wizard-form-group">
                  <label className="wizard-form-label">Field Name <span className="wizard-form-asterisk">*</span></label>
                  <input type="text" placeholder="e.g. Main Plot" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="wizard-form-input" />
                </div>
                
                <div className="wizard-form-group">
                  <label className="wizard-form-label">Crop Type <span className="wizard-form-asterisk">*</span></label>
                  <div className="wizard-form-icon-wrapper">
                    <div className="wizard-form-icon warning"><Leaf size={18} /></div>
                    <select className="wizard-form-input with-icon wizard-form-select" value={formData.crop} onChange={(e) => setFormData({...formData, crop: e.target.value})}>
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

                <div className="wizard-form-group">
                  <label className="wizard-form-label">Variety / Hybrid</label>
                  <input type="text" value={formData.variety} onChange={(e) => setFormData({...formData, variety: e.target.value})} className="wizard-form-input" />
                </div>

                <div className="wizard-form-group">
                  <label className="wizard-form-label">Sowing Date <span className="wizard-form-asterisk">*</span></label>
                  <div className="wizard-form-icon-wrapper">
                    <div className="wizard-form-icon muted"><Calendar size={18} /></div>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="wizard-form-input with-icon" />
                  </div>
                </div>

                <div className="wizard-form-group">
                  <label className="wizard-form-label">Calculated Area</label>
                  <input type="text" value={`${areaHectares} ha`} disabled className="wizard-form-input" />
                </div>

                <div className="wizard-form-group">
                  <label className="wizard-form-label">Irrigation Source</label>
                  <div className="wizard-form-icon-wrapper">
                    <div className="wizard-form-icon info"><Droplet size={18} /></div>
                     <select className="wizard-form-input with-icon wizard-form-select" value={formData.irrigation} onChange={(e) => setFormData({...formData, irrigation: e.target.value})}>
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

                <div className="wizard-form-group full">
                  <label className="wizard-form-label">Description <span className="wizard-form-optional">(Optional)</span></label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3" 
                    className="wizard-form-textarea"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="wizard-side-col taller">
              <div className="wizard-side-card">
                <h3 className="wizard-card-title">Field Summary</h3>
                
                <div className="wizard-summary-map" style={{ zIndex: 1}}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={16}
                    options={{
                      mapTypeId: 'satellite',
                      disableDefaultUI: true,
                      draggable: false,
                      zoomControl: false,
                      scrollwheel: false,
                      disableDoubleClickZoom: true,
                      mapId: 'AGRIMESH_MAP',
                    }}
                  >
                    {boundaryCoords.length > 0 && (
                      <Polygon
                        paths={boundaryCoords}
                        options={{
                          fillColor: '#22c55e',
                          fillOpacity: 0.4,
                          strokeColor: '#22c55e',
                          strokeOpacity: 1,
                          strokeWeight: 2
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>

                <div className="wizard-summary-stats">
                  <div className="wizard-stat-row bordered"><div className="wizard-stat-label"><MapPin size={16} className="icon"/> Location</div><span className="wizard-stat-value" style={{textAlign: 'right', maxWidth: '150px'}}>{location.address}</span></div>
                  <div className="wizard-stat-row bordered"><div className="wizard-stat-label"><Crosshair size={16} className="icon"/> Area</div><span className="wizard-stat-value">{areaHectares} ha</span></div>
                  <div className="wizard-stat-row bordered"><div className="wizard-stat-label"><Leaf size={16} className="icon"/> Crop</div><span className="wizard-stat-value">{formData.crop}</span></div>
                  <div className="wizard-stat-row bordered"><div className="wizard-stat-label"><Calendar size={16} className="icon"/> Sowing Date</div><span className="wizard-stat-value">{formData.date}</span></div>
                </div>
              </div>

              <div className="wizard-actions">
                <button onClick={() => setStep(2)} className="wizard-btn-outline" disabled={isSubmitting}>Back</button>
                <button onClick={handleSubmit} className="wizard-btn-solid" disabled={!formData.name || !formData.date || isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Save Field"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRM */}
        {step === 4 && (
          <div className="wizard-step-content xl-cols-3">
            <div className="wizard-main-col-xl-2" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <div className="wizard-side-card">
                <div className="wizard-success-header">
                  <div className="wizard-success-icon-wrapper">
                    <Check size={40} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="wizard-success-title">Field Registered Successfully!</h2>
                    <p className="wizard-success-subtitle">The geographical boundary of {formData.name} is now locked in AgriMesh.</p>
                  </div>
                </div>

                <div className="wizard-divider"></div>

                <h3 className="wizard-next-title">Layer 01 Active</h3>
                <p className="wizard-next-subtitle">AgriMesh will now use this precise polygon to fetch satellite and weather intelligence.</p>

                <div className="wizard-next-grid">
                  <div className="wizard-next-card">
                    <CloudUpload size={28} className="wizard-next-icon" strokeWidth={1.5} />
                    <h4 className="wizard-next-card-title">Copernicus Sentinel-2</h4>
                    <p className="wizard-next-card-desc">We are analyzing pixels that intersect your field boundary.</p>
                  </div>
                  <div className="wizard-next-card">
                    <BrainCircuit size={28} className="wizard-next-icon" strokeWidth={1.5} />
                    <h4 className="wizard-next-card-title">Micro-climate Weather</h4>
                    <p className="wizard-next-card-desc">Weather data snapped to your exact GPS coordinates.</p>
                  </div>
                </div>

                 <div className="wizard-actions" style={{marginTop: '2rem', flexDirection: 'column', gap: '0.75rem'}}>
                   <button 
                     onClick={() => navigate(createdFieldId ? `/fields/${createdFieldId}` : '/fields')} 
                     className="wizard-btn-solid"
                   >
                     View My Field Dashboard
                   </button>
                   <button
                     onClick={() => navigate('/fields')}
                     className="wizard-btn-outline"
                   >
                     Back to All Fields
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple pin overlay — avoids the deprecated google.maps.Marker
const LocationPin = ({ position, map }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!map || !position || !window.google) return;

    class PinOverlay extends window.google.maps.OverlayView {
      constructor(pos) {
        super();
        this.pos = pos;
        this.div = null;
      }
      onAdd() {
        this.div = document.createElement('div');
        this.div.style.cssText = 'position:absolute;width:24px;height:24px;transform:translate(-50%,-100%)';
        this.div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.div);
      }
      draw() {
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.pos.lat, this.pos.lng)
        );
        if (point && this.div) {
          this.div.style.left = point.x + 'px';
          this.div.style.top = point.y + 'px';
        }
      }
      onRemove() {
        if (this.div) { this.div.parentNode?.removeChild(this.div); this.div = null; }
      }
    }

    const overlay = new PinOverlay(position);
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
    };
  }, [map, position]);

  return null;
};

const StepIndicator = ({ active, current, completed, num, label }) => {
  return (
    <div className={`wizard-step-indicator ${active ? "active" : "inactive"}`}>
      <div className={`wizard-step-circle ${current ? "current" : completed ? "completed" : "pending"}`}>
        {completed ? <Check size={16} strokeWidth={3} /> : num}
      </div>
      <span className={`wizard-step-label ${current ? "current" : active ? "active" : "pending"}`}>
        {label}
      </span>
    </div>
  );
};
