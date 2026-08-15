import React, { useState } from 'react';
import { useSatelliteHealth } from '../hooks/useSatelliteHealth';
import { SatelliteFieldMap } from './SatelliteFieldMap';
import { SatelliteTrendChart } from './SatelliteTrendChart';
import { X, AlertTriangle, Camera } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface SatelliteDetailViewProps {
  fieldId: string;
  fieldBoundary: { lat: number; lng: number }[];
  onClose: () => void;
}

export const SatelliteDetailView: React.FC<SatelliteDetailViewProps> = ({ fieldId, fieldBoundary, onClose }) => {
  const { data, timeline, loading, error } = useSatelliteHealth(fieldId);
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);

  if (loading) {
    return <div className="p-8 text-center text-text-muted animate-pulse font-bold uppercase tracking-widest">Loading satellite data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-danger border border-danger">{error}</div>;
  }

  const activeAnomaly = data?.activeAnomalies.find(a => a.id === selectedAnomaly);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 bg-background border-b border-border p-4 flex justify-between items-center z-20">
         <h2 className="text-xl font-bold uppercase tracking-wider">Satellite Field Health</h2>
         <button onClick={onClose} className="p-2 border border-border hover:bg-surface">
           <X size={24} />
         </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Map Section */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-bold uppercase tracking-wider">Current Observation</h3>
            <p className="text-sm text-text-muted">
              {data?.latestTile ? `Pass from ${new Date(data.latestTile.captureDate).toLocaleDateString()}` : 'No recent data available'}
            </p>
          </div>
          
          <SatelliteFieldMap 
            boundary={fieldBoundary} 
            data={data} 
            onAnomalyClick={(id) => setSelectedAnomaly(id)}
          />
          
          {/* Selected Anomaly Card */}
          {activeAnomaly && (
            <div className="mt-4 border border-warning bg-surface p-4 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-warning mt-1" size={24} />
                <div>
                  <h4 className="font-bold uppercase tracking-widest">Stress Detected: {activeAnomaly.subregionLabel}</h4>
                  <p className="text-sm text-text-muted">
                    Detected {new Date(activeAnomaly.detectedDate).toLocaleDateString()}. Vegetation index has dropped significantly vs recent passes.
                  </p>
                </div>
              </div>
              <Button size="sm" className="whitespace-nowrap" onClick={() => console.log('Deep link to Layer 07 Diagnosis flow')}>
                <Camera size={16} /> INSPECT ON GROUND
              </Button>
            </div>
          )}
        </section>

        {/* Trend Section */}
        <section>
           <SatelliteTrendChart timeline={timeline} />
        </section>

      </div>
    </div>
  );
};
