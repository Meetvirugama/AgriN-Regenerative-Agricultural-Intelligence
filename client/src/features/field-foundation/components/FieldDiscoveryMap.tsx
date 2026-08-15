import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

interface FieldDiscoveryMapProps {
  center: { lat: number; lng: number };
  onYesThisIsMine: () => void;
  onDrawField: () => void;
}

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = ['drawing', 'geometry'];

export const FieldDiscoveryMap: React.FC<FieldDiscoveryMapProps> = ({ center, onYesThisIsMine, onDrawField }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) {
    return (
      <div className="w-full h-[60vh] bg-gray-100 flex items-center justify-center border border-border">
        <p className="text-danger font-bold uppercase">Failed to load map.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[70vh] border border-border">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          mapTypeId="satellite"
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {/* Simulated detected field boundary or user's location marker would go here */}
          <div className="absolute top-4 left-4 bg-text-main text-background px-3 py-1 border border-border text-xs font-bold tracking-widest uppercase">
            SATELLITE
          </div>
        </GoogleMap>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 font-bold uppercase tracking-widest">
          Loading Map...
        </div>
      )}

      {/* Overlay UI */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <div className="bg-background p-6 border border-border flex flex-col gap-4 mx-auto max-w-sm w-full animate-fade-in">
          <h3 className="text-sm font-bold text-center uppercase tracking-wider mb-2">Is this your field?</h3>
          <button className="btn btn-primary w-full" onClick={onYesThisIsMine}>
            YES, THIS IS MINE
          </button>
          <button className="btn btn-secondary w-full" onClick={onDrawField}>
            DRAW FIELD MANUALLY
          </button>
        </div>
      </div>
    </div>
  );
};
