import React, { useState } from "react";
import { GoogleMap, Polygon } from "@react-google-maps/api";
import { Cloud } from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export const SatelliteFieldMap = ({ boundary, data, onAnomalyClick }) => {
  const [_map, setMap] = useState(null);

  // Calculate center of boundary
  const center = React.useMemo(() => {
    if (!boundary || boundary.length === 0)
      return { lat: 20.5937, lng: 78.9629 };
    const latSum = boundary.reduce((sum, pt) => sum + pt.lat, 0);
    const lngSum = boundary.reduce((sum, pt) => sum + pt.lng, 0);
    return { lat: latSum / boundary.length, lng: lngSum / boundary.length };
  }, [boundary]);

  const onLoad = React.useCallback(
    function callback(map) {
      if (boundary && boundary.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        boundary.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds);
        // Zoom out slightly to give context
        const listener = window.google.maps.event.addListener(
          map,
          "idle",
          () => {
            map.setZoom((map.getZoom() || 18) - 1);
            window.google.maps.event.removeListener(listener);
          },
        );
      }
      setMap(map);
    },
    [boundary],
  );

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const hasCloudCover = data?.latestTile && data.latestTile.cloudCoverPct > 50;

  return (
    <div className="relative w-full h-[400px] border border-border bg-surface">
      {hasCloudCover && (
        <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center text-text-main p-6 text-center">
          <Cloud size={48} className="mb-4 text-text-muted" />
          <h3 className="font-bold uppercase tracking-widest mb-2">
            Cloud Cover
          </h3>
          <p className="text-sm max-w-xs">
            Latest satellite pass was obstructed by clouds. Showing last known
            clear data below.
          </p>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={18}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeId: "satellite",
          disableDefaultUI: true,
          zoomControl: true,
          tilt: 0,
        }}
      >
        {/* Main field boundary */}
        <Polygon
          paths={boundary}
          options={{
            fillColor: "transparent",
            strokeColor: "#ffffff",
            strokeOpacity: 1,
            strokeWeight: 2,
          }}
        />

        {/* Anomaly Overlays */}
        {data?.activeAnomalies.map((anomaly) => {
          // In a real app, we'd parse GeoJSON polygon to LatLng[] here
          // For mock, we'll just simulate a smaller polygon based on center
          const mockAnomalyPath = boundary.map((pt) => ({
            lat: pt.lat + (center.lat - pt.lat) * 0.3,
            lng: pt.lng + (center.lng - pt.lng) * 0.3,
          }));
          const color = anomaly.severity === "high" ? "#dc2626" : "#f59e0b";
          return (
            <Polygon
              key={anomaly.id}
              paths={mockAnomalyPath}
              options={{
                fillColor: color,
                fillOpacity: 0.4,
                strokeColor: color,
                strokeOpacity: 1,
                strokeWeight: 2,
                zIndex: 10,
              }}
              onClick={() => onAnomalyClick?.(anomaly.id)}
            />
          );
        })}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background border border-border p-3 text-xs font-bold uppercase z-10 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-transparent border-2 border-white"></div>
          <span>Field Boundary</span>
        </div>
        {data?.activeAnomalies && data.activeAnomalies.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/40 border-2 border-warning"></div>
            <span>Stress Detected</span>
          </div>
        )}
      </div>
    </div>
  );
};
