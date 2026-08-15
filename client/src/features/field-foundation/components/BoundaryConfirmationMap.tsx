import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, DrawingManager } from '@react-google-maps/api';
import { LatLng } from '../types/field.types';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

interface BoundaryConfirmationMapProps {
  center: LatLng;
  initialBoundary: LatLng[];
  isDrawingMode?: boolean;
  onConfirm: (boundary: LatLng[], areaHa: number) => void;
  onEdit: () => void;
}

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = ['drawing', 'geometry'];

export const BoundaryConfirmationMap: React.FC<BoundaryConfirmationMapProps> = ({ 
  center, 
  initialBoundary, 
  isDrawingMode = false,
  onConfirm, 
  onEdit 
}) => {
  const [boundary, setBoundary] = useState<LatLng[]>(initialBoundary);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Dummy area calculation for UX (in a real app, use google.maps.geometry.spherical.computeArea)
  const calculateArea = (path: LatLng[]) => {
    return path.length > 2 ? 1.24 : 0; // Fixed mockup value
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const newBoundary: LatLng[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      newBoundary.push({ lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
    }
    setBoundary(newBoundary);
    // Remove the drawn polygon as we will render our own
    polygon.setMap(null);
  };

  return (
    <div className="relative w-full h-[70vh] border border-border">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={17}
          mapTypeId="satellite"
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {!isDrawingMode && boundary.length > 0 && (
            <Polygon
              paths={boundary}
              options={{
                fillColor: '#16a34a',
                fillOpacity: 0.4,
                strokeWeight: 2,
                strokeColor: '#16a34a',
                editable: false,
              }}
            />
          )}

          {isDrawingMode && (
            <DrawingManager
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: window.google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [window.google.maps.drawing.OverlayType.POLYGON]
                },
                polygonOptions: {
                  fillColor: '#16a34a',
                  fillOpacity: 0.4,
                  strokeWeight: 2,
                  strokeColor: '#16a34a',
                  editable: true,
                }
              }}
              onPolygonComplete={handlePolygonComplete}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 font-bold tracking-widest uppercase">
          Loading Map...
        </div>
      )}

      {/* Overlay UI */}
      {!isDrawingMode && boundary.length > 0 && (
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="bg-background p-6 border border-border flex flex-col gap-4 mx-auto max-w-sm w-full animate-fade-in">
            <h3 className="text-sm font-bold text-center tracking-widest uppercase mb-2">Field detected</h3>
            
            <div className="border border-border bg-surface p-3 text-center mb-2">
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Area<br/></span>
              <span className="font-bold text-lg">{calculateArea(boundary)} hectares</span>
            </div>

            <button 
              className="btn btn-primary w-full" 
              onClick={() => onConfirm(boundary, calculateArea(boundary))}
            >
              CONFIRM FIELD
            </button>
            <button 
              className="btn btn-secondary w-full" 
              onClick={onEdit}
            >
              EDIT BOUNDARY
            </button>
          </div>
        </div>
      )}

      {isDrawingMode && boundary.length > 0 && (
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="bg-background p-6 border border-border flex flex-col gap-4 mx-auto max-w-sm w-full animate-fade-in">
            <h3 className="text-sm font-bold text-center tracking-widest uppercase mb-2">Edit field</h3>
            <ul className="text-xs font-bold uppercase text-text-muted mb-4 space-y-2 border border-border p-4 bg-surface">
              <li>1. Move a corner</li>
              <li>2. Add a corner</li>
              <li>3. Remove a corner</li>
            </ul>
            <button 
              className="btn btn-primary w-full" 
              onClick={() => onConfirm(boundary, calculateArea(boundary))}
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
