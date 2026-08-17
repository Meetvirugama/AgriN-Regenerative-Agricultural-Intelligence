import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Polygon } from "@react-google-maps/api";
import { Cloud, Lock, Loader2, Layers, Map as MapIcon, Leaf } from "lucide-react";
import { useEarthEngine } from "../../auth/EarthEngineProvider";
import { 
  geoJsonToEeGeometry, 
  getSentinel2Image, 
  getTrueColorMapId, 
  getNdviMapId 
} from "../../field-management/api/earthEngine";
import { Button } from "../../../components/ui/Button";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export const SatelliteFieldMap = ({ boundary, data, onAnomalyClick }) => {
  const [mapInstance, setMapInstance] = useState(null);
  const { isAuthenticated, isInitializing, error, login } = useEarthEngine();
  
  const [activeLayer, setActiveLayer] = useState("truecolor"); // 'none', 'truecolor', 'ndvi'
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const layerRef = useRef(null); // Keep track of the ImageMapType

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
      setMapInstance(map);
    },
    [boundary],
  );

  const onUnmount = React.useCallback(function callback() {
    setMapInstance(null);
  }, []);

  // Update Earth Engine Layer when authentication or selected layer changes
  useEffect(() => {
    const renderEarthEngineLayer = async () => {
      if (!mapInstance || !isAuthenticated || activeLayer === "none") {
        if (mapInstance && layerRef.current) {
          mapInstance.overlayMapTypes.clear();
          layerRef.current = null;
        }
        return;
      }

      setIsLayerLoading(true);
      try {
        // Clear existing overlays
        mapInstance.overlayMapTypes.clear();
        layerRef.current = null;

        // Convert boundary to ee.Geometry
        const coords = boundary.map(pt => [pt.lng, pt.lat]);
        if (coords.length > 0) coords.push([boundary[0].lng, boundary[0].lat]); // close
        
        const geojson = {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coords] }
        };
        const eeGeom = geoJsonToEeGeometry(geojson);
        
        // Fetch Sentinel-2 Image
        const eeImage = getSentinel2Image(eeGeom);

        // Get Map ID based on layer type
        let tileUrlFormat = "";
        if (activeLayer === "truecolor") {
          tileUrlFormat = await getTrueColorMapId(eeImage);
        } else if (activeLayer === "ndvi") {
          tileUrlFormat = await getNdviMapId(eeImage);
        }

        // Create Google Maps ImageMapType
        const eeMapType = new window.google.maps.ImageMapType({
          getTileUrl: function(coord, zoom) {
            const url = tileUrlFormat
              .replace('{x}', coord.x)
              .replace('{y}', coord.y)
              .replace('{z}', zoom);
            return url;
          },
          tileSize: new window.google.maps.Size(256, 256),
          maxZoom: 24,
          minZoom: 0,
          opacity: 1.0,
          name: "EarthEngine"
        });

        layerRef.current = eeMapType;
        mapInstance.overlayMapTypes.push(eeMapType);

      } catch (err) {
        console.error("Failed to render EE Layer:", err);
      } finally {
        setIsLayerLoading(false);
      }
    };

    renderEarthEngineLayer();
  }, [mapInstance, isAuthenticated, activeLayer, boundary]);

  const hasCloudCover = data?.latestTile && data.latestTile.cloudCoverPct > 50;

  return (
    <div className="relative w-full h-[500px] border border-border bg-surface flex flex-col">
      {/* Earth Engine Auth Overlay */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center text-text-main p-6 text-center">
          <Lock size={48} className="mb-4 text-primary" />
          <h3 className="font-bold text-xl uppercase tracking-widest mb-2">
            Earth Engine Required
          </h3>
          <p className="text-sm max-w-sm mb-6 text-text-muted">
            Connect to Google Earth Engine to fetch live Sentinel-2 satellite imagery, True Color composites, and NDVI crop health maps for this field boundary.
          </p>
          <Button onClick={() => login()} disabled={isInitializing}>
            {isInitializing ? (
              <><Loader2 className="animate-spin mr-2" size={16} /> Connecting...</>
            ) : (
              "Connect Earth Engine"
            )}
          </Button>
          {error && <p className="text-danger text-sm mt-4 font-bold">{error}</p>}
        </div>
      )}

      {/* Layer Controls */}
      {isAuthenticated && (
        <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-md border border-border rounded shadow-lg p-2 flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1 px-2 pt-1 flex items-center gap-1">
            <Layers size={12} /> Map Layers
          </h4>
          <button 
            onClick={() => setActiveLayer("none")}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-wider rounded text-left transition-colors ${activeLayer === 'none' ? 'bg-surface text-primary' : 'hover:bg-surface text-text-muted'}`}
          >
            Google Satellite
          </button>
          <button 
            onClick={() => setActiveLayer("truecolor")}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-wider rounded text-left flex items-center gap-2 transition-colors ${activeLayer === 'truecolor' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface text-text-muted'}`}
          >
            <MapIcon size={16} /> Sentinel-2 (RGB)
          </button>
          <button 
            onClick={() => setActiveLayer("ndvi")}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-wider rounded text-left flex items-center gap-2 transition-colors ${activeLayer === 'ndvi' ? 'bg-warning text-background' : 'hover:bg-surface text-text-muted'}`}
          >
            <Leaf size={16} /> NDVI Crop Health
          </button>
          
          {isLayerLoading && (
            <div className="text-xs text-primary flex items-center gap-1 px-2 pt-2 animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Processing Imagery...
            </div>
          )}
        </div>
      )}

      {hasCloudCover && isAuthenticated && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-background/80 backdrop-blur-sm p-4 text-center border-t border-border">
          <div className="flex items-center justify-center gap-2 text-warning mb-1">
            <Cloud size={20} />
            <h3 className="font-bold uppercase tracking-widest">High Cloud Cover</h3>
          </div>
          <p className="text-sm text-text-muted">
            Recent satellite passes are obstructed by clouds. Displaying the best cloud-free composite from the last 30 days.
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
            zIndex: 5
          }}
        />

        {/* Anomaly Overlays */}
        {data?.activeAnomalies.map((anomaly) => {
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
        {activeLayer === 'ndvi' && (
          <div className="mt-4 mb-2">
            <span className="mb-1 block">NDVI Range</span>
            <div className="w-full h-2 rounded bg-gradient-to-r from-[#d73027] via-[#fee08b] to-[#1a9850]"></div>
            <div className="flex justify-between mt-1 text-[10px] text-text-muted">
              <span>Low (Bare)</span>
              <span>High (Dense)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
