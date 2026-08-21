import React from "react";
import { Sun, CloudRain, Cloud, Wind, Droplets, ThermometerSun, ChevronRight } from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";

export function WeatherStrip({ forecasts = [], flags = [], isLoading, onExpand }) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm animate-pulse flex items-center justify-between">
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-neutral/20 rounded-full"></div>
              <div className="w-8 h-2 bg-neutral/20 rounded-full"></div>
            </div>
          ))}
        </div>
        <div className="w-48 h-6 bg-neutral/20 rounded-full hidden sm:block"></div>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm text-center text-text-muted font-bold text-sm tracking-wide">
        Weather data temporarily unavailable
      </div>
    );
  }

  const next3Days = forecasts.slice(0, 3);

  let primaryMessage = "";
  let messageColor = "text-text-muted";
  let bgStyle = "bg-surface border-border";

  if (flags.length > 0) {
    const activeFlags = [...flags].sort((a, b) => {
      const s = { high: 3, medium: 2, low: 1 };
      return s[b.severity] - s[a.severity];
    });
    const topFlag = activeFlags[0];
    if (topFlag.message) {
      primaryMessage = topFlag.message;
      if (topFlag.severity === "high") {
        messageColor = "text-error-strong";
        bgStyle = "bg-error/5 border-error/30";
      } else if (topFlag.event_type === "rain_expected") {
        messageColor = "text-primary-strong";
        bgStyle = "bg-primary/5 border-primary/30";
      } else {
        messageColor = "text-warning-strong";
        bgStyle = "bg-warning/5 border-warning/30";
      }
    }
  }

  const getWeatherIcon = (snapshot) => {
    if (snapshot.rainfall_mm > 5) return <CloudRain size={26} className="text-primary stroke-[2.5]" />;
    if (snapshot.humidity_pct > 80) return <Cloud size={26} className="text-text-muted stroke-[2.5]" />;
    return <Sun size={26} className="text-warning stroke-[2.5]" />;
  };

  return (
    <div className={`group relative w-full ${bgStyle} border p-5 sm:p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
        
        {/* Days Forecast */}
        <div className="flex items-center gap-6 sm:gap-8">
          {next3Days.map((day, idx) => {
            const isToday = idx === 0;
            return (
              <div key={idx} className="flex flex-col items-center group/day relative">
                <div className={`
                  p-3 rounded-2xl transition-all duration-300
                  ${isToday ? "bg-surface shadow-sm border border-border scale-110" : "hover:bg-neutral/5"}
                `}>
                  {getWeatherIcon(day)}
                </div>
                <span className={`
                  mt-3 text-xs font-black uppercase tracking-widest
                  ${isToday ? "text-text" : "text-text-muted"}
                `}>
                  {isToday ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                
                {/* Temp Hint for Today */}
                {isToday && day.temp_max && (
                  <span className="absolute -bottom-5 text-[10px] font-bold text-text-muted/70">{Math.round(day.temp_max)}°</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Message and Actions */}
        <div className="flex flex-col sm:items-end gap-3 sm:gap-1 flex-1 min-w-0">
          {primaryMessage && (
            <div className={`text-sm sm:text-base font-bold flex items-center gap-2 ${messageColor} text-left sm:text-right line-clamp-2`}>
              <span>{primaryMessage}</span>
              <TextToSpeechButton
                textToRead={primaryMessage}
                className={`w-8 h-8 p-1.5 rounded-full ${messageColor} hover:bg-current/10 transition-colors shrink-0`}
              />
            </div>
          )}
          
          <button
            onClick={onExpand}
            className="mt-2 sm:mt-0 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary w-max"
            aria-label="View full weather details"
          >
            See full forecast
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
