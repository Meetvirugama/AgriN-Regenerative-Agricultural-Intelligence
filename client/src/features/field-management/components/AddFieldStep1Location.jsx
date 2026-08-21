import React, { useState, useRef, useCallback } from "react";
import { ArrowLeft, Search, Crosshair, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Autocomplete } from "@react-google-maps/api";

import "./AddFieldStep.css";

const libraries = ["places", "geometry"];
const mapContainerStyle = { width: "100%", height: "100%" };

export const AddFieldStep1Location = () => {
  const navigate = useNavigate();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [location, setLocation] = useState({
    lat: 29.731,
    lng: 78.265,
    address: "Madhopur, Uttar Pradesh, India",
  });
  const [mapCenter, setMapCenter] = useState({ lat: 29.731, lng: 78.265 });

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onMapUnmount = useCallback(() => { mapRef.current = null; }, []);

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const address =
        status === "OK" && results[0]
          ? results[0].formatted_address
          : "Unknown Location";
      setLocation({ lat, lng, address });
      setMapCenter({ lat, lng });
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
    reverseGeocode(e.latLng.lat(), e.latLng.lng());
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocation({ lat, lng, address: place.formatted_address });
        setMapCenter({ lat, lng });
      }
    }
  };

  const goNext = () => {
    const params = new URLSearchParams({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });
    navigate(`/fields/add/boundary?${params.toString()}`);
  };

  if (loadError) return (
    <div style={{ padding: "2rem", color: "var(--danger)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
      Maps failed to load. Check your API key.
    </div>
  );

  if (!isLoaded) return (
    <div style={{ padding: "2rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #16a34a", borderTopColor: "transparent", borderRadius: "50%" }} />
      Loading Maps…
    </div>
  );

  return (
    <div className="add-field-page">
      {/* Top bar */}
      <div className="add-field-topbar">
        <button className="add-field-back-btn" onClick={() => navigate("/fields")}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="add-field-title">Add New Field</h1>
        <span className="add-field-step-pill">Step 1 of 3</span>
      </div>

      {/* Progress bar */}
      <div className="add-field-progress">
        <div className="add-field-progress-fill" style={{ width: "33%" }} />
      </div>

      {/* Body */}
      <div className="add-field-body">
        {/* Search */}
        <div className="add-field-search-bar">
          <div className="add-field-search-wrap">
            <Search size={16} className="add-field-search-icon" />
            <Autocomplete
              onLoad={(a) => { autocompleteRef.current = a; }}
              onPlaceChanged={onPlaceChanged}
            >
              <input
                type="text"
                placeholder="Search location (e.g. Madhopur)…"
                className="add-field-search-input"
              />
            </Autocomplete>
          </div>
          <button className="add-field-gps-btn" onClick={useMyLocation} title="Use my GPS location">
            <Crosshair size={18} />
          </button>
        </div>

        {/* Selected location strip */}
        <div className="add-field-location-strip">
          <MapPin size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <span className="add-field-location-name">{location.address}</span>
          <span className="add-field-location-coords">
            {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
          </span>
        </div>

        {/* Map — fills all remaining space */}
        <div className="add-field-map-wrap">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={onMapClick}
            options={{
              mapTypeId: "satellite",
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            <LocationPin position={{ lat: location.lat, lng: location.lng }} map={mapRef.current} />
          </GoogleMap>
        </div>
      </div>

      {/* Action bar */}
      <div className="add-field-actions">
        <button className="add-field-btn-outline" onClick={() => navigate("/fields")}>
          Cancel
        </button>
        <button className="add-field-btn-solid" onClick={goNext}>
          Next — Draw Boundary →
        </button>
      </div>
    </div>
  );
};

/* ── Custom map pin ──────────────────────────────────────────── */
import { useEffect } from "react";

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
        this.div = document.createElement("div");
        this.div.style.cssText = "position:absolute;width:24px;height:24px;transform:translate(-50%,-100%)";
        this.div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
        this.getPanes().overlayMouseTarget.appendChild(this.div);
      }
      draw() {
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.pos.lat, this.pos.lng)
        );
        if (point && this.div) {
          this.div.style.left = point.x + "px";
          this.div.style.top = point.y + "px";
        }
      }
      onRemove() {
        if (this.div) { this.div.parentNode?.removeChild(this.div); this.div = null; }
      }
    }

    const overlay = new PinOverlay(position);
    overlay.setMap(map);
    overlayRef.current = overlay;
    return () => overlay.setMap(null);
  }, [map, position]);

  return null;
};
