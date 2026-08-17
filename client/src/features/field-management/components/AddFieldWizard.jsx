import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ArrowLeft, Search, Crosshair, MapPin, Info, Satellite, CloudRain, 
  Map as MapIcon, Plus, Minus, Check, MousePointer2, PenTool, Edit3, 
  Trash2, Navigation, Calendar, Droplet, Triangle, CloudUpload, 
  BrainCircuit, Lightbulb, Tag, Bell, Leaf, Loader2, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, Polygon, DrawingManager, Autocomplete } from '@react-google-maps/api';
import { cropApi } from "../../crop-context/api/cropApi";

import "./AddFieldWizard.css";

const libraries = ['places', 'drawing', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

export const AddFieldWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
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

  // Boundary State
  const [boundaryCoords, setBoundaryCoords] = useState([]);
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

  const onMapClick = (e) => {
    if (step === 1) {
      reverseGeocode(e.latLng.lat(), e.latLng.lng());
    }
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

  const onPolygonComplete = (polygon) => {
    const path = polygon.getPath().getArray();
    const coords = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
    
    // We want to keep just one polygon, so we remove the drawn one and render our own <Polygon>
    polygon.setMap(null);
    setBoundaryCoords(coords);

    if (window.google && window.google.maps.geometry) {
      const sqMeters = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
      setAreaHectares((sqMeters / 10000).toFixed(2));
    }
  };
  
  const clearBoundary = () => {
    setBoundaryCoords([]);
    setAreaHectares(0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build GeoJSON format for the backend
      const ring = boundaryCoords.map(c => [c.lng, c.lat]);
      if (ring.length > 0) {
        ring.push([boundaryCoords[0].lng, boundaryCoords[0].lat]); // close the polygon
      }
      const geojson = boundaryCoords.length > 0 ? {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ring]
        },
        properties: {}
      } : null;

      await cropApi.createField({
        name: formData.name,
        cropType: formData.crop,
        sowingDate: formData.date,
        cropVariety: formData.variety,
        lat: location.lat,
        lng: location.lng,
        locationName: location.address,
        areaHectares: parseFloat(areaHectares) || 0,
        boundaryGeojson: geojson
      });
      setStep(4);
    } catch (err) {
      console.error("Failed to create field", err);
      alert("Failed to create field. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) return <div style={{padding: '2rem'}}>Error loading maps. Please check your API key.</div>;
  if (!isLoaded) return <div style={{padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center'}}><Loader2 className="animate-spin" /> Loading Maps...</div>;

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
        </div>
        
        {/* STEPPER */}
        {step < 4 && (
          <div className="wizard-stepper">
            <StepIndicator active={step >= 1} current={step === 1} completed={step > 1} num={1} label="Location" />
            <div className={`wizard-step-line ${step > 1 ? 'active' : 'inactive'}`}></div>
            <StepIndicator active={step >= 2} current={step === 2} completed={step > 2} num={2} label="Boundary" />
            <div className={`wizard-step-line ${step > 2 ? 'active' : 'inactive'}`}></div>
            <StepIndicator active={step >= 3} current={step === 3} completed={step > 3} num={3} label="Details" />
          </div>
        )}

        {/* STEP 1: LOCATION */}
        {step === 1 && (
          <div className="wizard-step-content cols-3">
            <div className="wizard-main-col wizard-col-flex">
              <div>
                <h2 className="wizard-step-title">Step 1: Location</h2>
                <p className="wizard-step-subtitle">Search for your field or use your current location</p>
              </div>

              <div className="wizard-search-bar" style={{ position: 'relative' }}>
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
                <button className="wizard-target-btn" onClick={useMyLocation} title="Use My Location" style={{ color: 'var(--primary)'}}>
                  <Crosshair size={20} />
                </button>
              </div>

              <div className="wizard-map-wrapper" style={{ height: '400px', zIndex: 1 }}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={15}
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  onClick={onMapClick}
                  options={{
                    mapTypeId: 'satellite',
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                  }}
                >
                  <Marker position={{ lat: location.lat, lng: location.lng }} />
                </GoogleMap>
              </div>

              <div className="wizard-info-banner">
                <Info size={20} className="wizard-info-banner-icon" />
                <div>
                  <h4 className="wizard-info-banner-title">Tips</h4>
                  <p className="wizard-info-banner-desc">Click on the map to place a pin at your field's exact location, or click the Crosshair icon to use your GPS.</p>
                </div>
              </div>
            </div>

            <div className="wizard-side-col">
              <div className="wizard-side-card">
                <h3 className="wizard-card-title">Why we need your field location</h3>
                <div className="wizard-feature-list">
                  <div className="wizard-feature-item"><div className="wizard-feature-icon"><Satellite size={24} strokeWidth={1.5} /></div><p className="wizard-feature-text">Accurate field satellite imagery</p></div>
                  <div className="wizard-feature-item"><div className="wizard-feature-icon"><CloudRain size={24} strokeWidth={1.5} /></div><p className="wizard-feature-text">Field-local weather forecasts</p></div>
                  <div className="wizard-feature-item"><div className="wizard-feature-icon"><MapIcon size={24} strokeWidth={1.5} /></div><p className="wizard-feature-text">Advice specific to your field context</p></div>
                </div>
                
                <div className="wizard-divider"></div>
                
                <h3 className="wizard-card-title">Selected Location</h3>
                <div className="wizard-selected-location">
                  <div className="wizard-selected-info">
                    <div className="wizard-selected-icon"><MapPin size={24} fill="currentColor" /></div>
                    <div>
                      <p className="wizard-selected-title">{location.address}</p>
                      <p className="wizard-selected-coords">{location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="wizard-actions">
                <button onClick={() => navigate('/fields')} className="wizard-btn-outline">Cancel</button>
                <button onClick={() => setStep(2)} className="wizard-btn-solid">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BOUNDARY */}
        {step === 2 && (
          <div className="wizard-step-content cols-4">
            <div className="wizard-main-col-xl wizard-col-flex tall">
              <div className="wizard-step-header-row">
                <div>
                  <h2 className="wizard-step-title">Step 2: Draw Field Boundary</h2>
                  <p className="wizard-step-subtitle">Use the polygon tool to draw the boundary of your field</p>
                </div>
                <div className="wizard-inline-info">
                  <Info size={16} /> Draw the boundary as close as possible for accurate insights
                </div>
              </div>

              <div className="wizard-map-wrapper" style={{ height: '500px', zIndex: 1, position: 'relative' }}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={18}
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  options={{
                    mapTypeId: 'satellite',
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {boundaryCoords.length === 0 && (
                    <DrawingManager
                      onPolygonComplete={onPolygonComplete}
                      options={{
                        drawingControl: true,
                        drawingControlOptions: {
                          position: window.google.maps.ControlPosition.TOP_CENTER,
                          drawingModes: [window.google.maps.drawing.OverlayType.POLYGON]
                        },
                        polygonOptions: {
                          fillColor: '#22c55e',
                          fillOpacity: 0.4,
                          strokeWeight: 2,
                          strokeColor: '#22c55e',
                          clickable: false,
                          editable: false,
                          zIndex: 1
                        }
                      }}
                    />
                  )}
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
                
                {boundaryCoords.length > 0 && (
                  <button 
                    onClick={clearBoundary}
                    style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 10, background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                  >
                    <Trash2 size={16} /> Clear Drawing
                  </button>
                )}
              </div>
            </div>

            <div className="wizard-side-col tall">
              <div className="wizard-side-card">
                <p className="wizard-area-label">Field Area</p>
                <h3 className="wizard-area-value">{areaHectares} Hectares</h3>
                <p className="wizard-area-sub">({Math.round(areaHectares * 10000)} m²)</p>

                <div className="wizard-stats-list" style={{marginTop: '2rem'}}>
                  <div className="wizard-stat-row"><div className="wizard-stat-label"><MapPin size={16} className="icon"/> Latitude</div><span className="wizard-stat-value">{location.lat.toFixed(4)}° N</span></div>
                  <div className="wizard-stat-row"><div className="wizard-stat-label"><MapPin size={16} className="icon"/> Longitude</div><span className="wizard-stat-value">{location.lng.toFixed(4)}° E</span></div>
                </div>

                <div className="wizard-success-banner">
                  <h4 className="wizard-success-banner-title">Boundary Tips</h4>
                  <div className="wizard-success-banner-list">
                    <div className="wizard-success-banner-item"><div className="wizard-check-circle"><Check size={12} strokeWidth={3} /></div> Use the polygon tool on the map menu</div>
                    <div className="wizard-success-banner-item"><div className="wizard-check-circle"><Check size={12} strokeWidth={3} /></div> Click corners of your field</div>
                    <div className="wizard-success-banner-item"><div className="wizard-check-circle"><Check size={12} strokeWidth={3} /></div> Click the first point again to finish</div>
                  </div>
                </div>
              </div>

              <div className="wizard-actions">
                <button onClick={() => setStep(1)} className="wizard-btn-outline">Previous</button>
                <button onClick={() => setStep(3)} className="wizard-btn-solid" disabled={boundaryCoords.length === 0}>
                  Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
                      <option value="wheat">Wheat</option>
                      <option value="rice">Rice</option>
                      <option value="cotton">Cotton</option>
                      <option value="maize">Maize</option>
                      <option value="moong">Moong</option>
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
                      <option>Tube Well</option>
                      <option>Canal</option>
                      <option>Rainfed</option>
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
                      disableDoubleClickZoom: true
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

                <div className="wizard-actions" style={{marginTop: '2rem'}}>
                  <button 
                    onClick={() => navigate('/fields')} 
                    className="wizard-btn-solid"
                  >
                    View Field Dashboard
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
