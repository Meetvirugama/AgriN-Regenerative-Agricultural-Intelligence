import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationPermissionProps {
  onAllow: () => void;
  onManual: () => void;
}

export const LocationPermission: React.FC<LocationPermissionProps> = ({ onAllow, onManual }) => {
  return (
    <div className="animate-fade-in max-w-md mx-auto text-center flex flex-col items-center">
      <div className="border border-border p-4 mb-6">
        <MapPin size={32} className="text-text-main" />
      </div>
      
      <h2 className="text-xl font-bold uppercase tracking-wider mb-4">Find your field</h2>
      
      <p className="text-text-muted mb-8 text-lg font-medium">
        AgriMesh uses your location to help identify your field and provide location-specific agricultural information.
      </p>

      <div className="w-full flex flex-col gap-4">
        <button 
          className="btn btn-primary w-full py-3" 
          onClick={onAllow}
        >
          ALLOW LOCATION
        </button>
        
        <button 
          className="btn btn-secondary w-full py-3" 
          onClick={onManual}
        >
          I'LL CHOOSE MANUALLY
        </button>
      </div>
    </div>
  );
};
