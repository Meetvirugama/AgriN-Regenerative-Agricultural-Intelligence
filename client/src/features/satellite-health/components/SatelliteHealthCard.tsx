import React from 'react';
import { SatelliteHealthData } from '../types/satellite.types';
import { Satellite, AlertTriangle, CloudRain, CheckCircle, Info } from 'lucide-react';
import { TextToSpeechButton } from '../../voice/components/TextToSpeechButton';

interface SatelliteHealthCardProps {
  data: SatelliteHealthData | null;
  loading: boolean;
  onClick: () => void;
}

export const SatelliteHealthCard: React.FC<SatelliteHealthCardProps> = ({ data, loading, onClick }) => {
  if (loading) {
    return (
      <div className="sharp-card animate-pulse border-border">
        <div className="h-6 w-32 bg-surface mb-4"></div>
        <div className="h-4 w-48 bg-surface"></div>
      </div>
    );
  }

  if (!data || !data.latestTile) {
    return (
      <div className="sharp-card border-border border-dashed text-text-muted">
        <div className="flex items-center gap-2 mb-2">
          <Satellite size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">Satellite View</h3>
        </div>
        <p className="text-sm">No recent clear imagery available.</p>
      </div>
    );
  }

  const { latestTile, trend, activeAnomalies } = data;
  
  const hasAnomalies = activeAnomalies.length > 0;
  
  let severityColor = 'text-success';
  let Icon = CheckCircle;
  let summaryText = trend?.summaryText || 'Conditions are stable.';

  if (hasAnomalies) {
    const highSeverity = activeAnomalies.some(a => a.severity === 'high');
    severityColor = highSeverity ? 'text-danger' : 'text-warning';
    Icon = AlertTriangle;
    summaryText = `Stress patch detected in ${activeAnomalies[0].subregionLabel}.`;
  } else if (trend?.ndviTrendDirection === 'declining') {
    severityColor = 'text-warning';
    Icon = Info;
  }

  // Format date
  const dateStr = new Date(latestTile.captureDate).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });
  
  const daysAgo = Math.floor((new Date().getTime() - new Date(latestTile.captureDate).getTime()) / (1000 * 3600 * 24));
  const timeText = daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

  return (
    <div 
      className="bg-background border border-border p-5 cursor-pointer hover:bg-surface transition-all"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-text-muted">
          <Satellite size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">SATELLITE HEALTH</span>
        </div>
        <div className="text-xs text-text-muted font-medium">
          {timeText} ({dateStr})
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Icon className={`${severityColor} mt-1`} size={24} />
        <div>
          <p className="font-semibold text-lg flex items-center gap-2">
            {summaryText}
            <TextToSpeechButton 
              textToRead={`Satellite Health: ${summaryText}`} 
              className="w-7 h-7 p-1" 
            />
          </p>
          {latestTile.cloudCoverPct > 30 && (
            <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
              <CloudRain size={12} /> Partial cloud cover ({Math.round(latestTile.cloudCoverPct)}%)
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs font-bold uppercase tracking-widest text-text-muted">
         <span>Tap to inspect map</span>
         <span>→</span>
      </div>
    </div>
  );
};
