import {
  Sun,
  CloudRain,
  Cloud,
  Droplets,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export function WeatherDetails({ forecasts }) {
  if (!forecasts || forecasts.length === 0) return null;

  // Show up to 5 days
  const displayDays = forecasts.slice(0, 5);

  const getWeatherIcon = (snapshot) => {
    if (snapshot.rainfall_mm > 15)
      return <CloudRain size={32} className="text-primary" />;
    if (snapshot.rainfall_mm > 0)
      return <CloudRain size={32} className="text-primary opacity-70" />;
    if (snapshot.humidity_pct > 80)
      return <Cloud size={32} className="text-text-muted" />;
    return <Sun size={32} className="text-warning" />;
  };

  return (
    <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm animate-fade-in">
      <h3 className="font-bold mb-4 tracking-wide text-sm text-text-muted uppercase">
        5-Day Forecast
      </h3>

      <div className="flex flex-col gap-3">
        {displayDays.map((day, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 border border-neutral rounded-lg bg-background"
          >
            <div className="flex items-center gap-4 w-1/3">
              <span className="text-sm font-bold uppercase tracking-wider">
                {new Date(day.date).toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </span>
              <div>{getWeatherIcon(day)}</div>
            </div>

            <div className="flex flex-col items-end w-1/3">
              {day.rainfall_mm > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  <Droplets size={12} />
                  {day.rainfall_mm}mm
                </div>
              )}
            </div>

            <div className="flex gap-4 text-sm font-bold w-1/3 justify-end">
              <div className="flex items-center text-primary">
                <ArrowDown size={14} className="mr-0.5" /> {day.temp_min}°
              </div>
              <div className="flex items-center text-error">
                <ArrowUp size={14} className="mr-0.5" /> {day.temp_max}°
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
