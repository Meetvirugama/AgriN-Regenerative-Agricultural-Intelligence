import { Sun, CloudRain, Cloud } from 'lucide-react';
import { WeatherSnapshot, WeatherEventFlag } from '../api/weatherApi';

interface WeatherStripProps {
  forecasts: WeatherSnapshot[];
  flags: WeatherEventFlag[];
  isLoading: boolean;
  onExpand: () => void;
}

export function WeatherStrip({ forecasts, flags, isLoading, onExpand }: WeatherStripProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-neutral p-4 rounded-xl shadow-sm animate-pulse flex items-center justify-between">
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-neutral/20 rounded-full"></div>
          <div className="w-8 h-8 bg-neutral/20 rounded-full"></div>
          <div className="w-8 h-8 bg-neutral/20 rounded-full"></div>
        </div>
        <div className="w-32 h-4 bg-neutral/20 rounded"></div>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="bg-surface border border-neutral p-4 rounded-xl shadow-sm text-center text-text-muted font-bold text-sm">
        Weather data temporarily unavailable
      </div>
    );
  }

  // Get next 3 days
  const next3Days = forecasts.slice(0, 3);

  // Derive the primary message (this normally comes from Layer 09, but per prompt we render 
  // the derived flags or fall back to generic icon-only view if no text).
  let primaryMessage = "";
  let messageColor = "text-text-muted";
  
  if (flags.length > 0) {
    // Sort by severity (high > medium > low)
    const activeFlags = [...flags].sort((a, b) => {
      const s = { high: 3, medium: 2, low: 1 };
      return s[b.severity] - s[a.severity];
    });
    const topFlag = activeFlags[0];
    
    if (topFlag.message) {
      primaryMessage = topFlag.message;
      messageColor = "text-warning";
      if (topFlag.severity === 'high') messageColor = "text-error";
      if (topFlag.event_type === 'rain_expected' && topFlag.severity !== 'high') messageColor = "text-success";
    }
  }

  const getWeatherIcon = (snapshot: WeatherSnapshot) => {
    if (snapshot.rainfall_mm > 5) return <CloudRain size={24} className="text-primary" />;
    if (snapshot.humidity_pct > 80) return <Cloud size={24} className="text-text-muted" />;
    return <Sun size={24} className="text-warning" />;
  };

  return (
    <button 
      onClick={onExpand}
      className="w-full bg-surface border border-neutral p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-neutral/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      aria-label="View weather details"
    >
      <div className="flex gap-4">
        {next3Days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center">
            {getWeatherIcon(day)}
            <span className="text-[10px] font-bold mt-1 text-text-muted">
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>
      
      {primaryMessage && (
        <div className={`text-sm font-bold ${messageColor} text-right`}>
          {primaryMessage}
        </div>
      )}
    </button>
  );
}
