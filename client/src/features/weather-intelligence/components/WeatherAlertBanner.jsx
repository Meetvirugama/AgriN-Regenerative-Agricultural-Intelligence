import { useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  ThermometerSun,
  Droplets,
  Snowflake,
  X,
} from "lucide-react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";

export function WeatherAlertBanner({ flags }) {
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Only show the highest severity, non-dismissed active flag to avoid spamming the farmer
  const activeFlags = flags.filter((f) => !dismissedIds.has(f.id));
  if (activeFlags.length === 0) {
    return null;
  }

  // Sort by severity (high > medium > low)
  const severityScore = { high: 3, medium: 2, low: 1 };
  activeFlags.sort(
    (a, b) => severityScore[b.severity] - severityScore[a.severity],
  );
  const topFlag = activeFlags[0];

  const handleDismiss = () => {
    setDismissedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(topFlag.id);
      return newSet;
    });
  };

  const getAlertContent = (flag) => {
    let icon, title;
    switch (flag.event_type) {
      case "rain_expected":
        icon = <CloudRain size={24} />;
        title = "Rain Expected";
        break;
      case "heat_event":
        icon = <ThermometerSun size={24} />;
        title = "Extreme Heat Warning";
        break;
      case "humidity_spike":
        icon = <Droplets size={24} />;
        title = "High Humidity";
        break;
      case "frost_warning":
        icon = <Snowflake size={24} />;
        title = "Frost Warning";
        break;
      default:
        icon = <AlertTriangle size={24} />;
        title = "Weather Alert";
        break;
    }

    let color, textColor, borderColor;
    switch (flag.severity) {
      case "high":
        color = "bg-error/10";
        textColor = "text-error";
        borderColor = "border-error";
        break;
      case "medium":
        color = "bg-warning/10";
        textColor = "text-warning";
        borderColor = "border-warning";
        break;
      default:
        color = "bg-primary/10";
        textColor = "text-primary";
        borderColor = "border-primary";
        break;
    }

    return {
      icon,
      title,
      message: flag.message || "Please monitor field conditions.",
      color,
      textColor,
      borderColor,
    };
  };

  const content = getAlertContent(topFlag);

  return (
    <div
      className={`${content.color} border-2 ${content.borderColor} ${content.textColor} p-4 rounded-xl shadow-md mb-6 animate-fade-in`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-background/50">
            {content.icon}
          </div>
          <div>
            <h4 className="font-bold text-lg uppercase tracking-wide flex items-center gap-2">
              {content.title}
              <TextToSpeechButton
                textToRead={`Weather Alert: ${content.title}. ${content.message}`}
                className="w-7 h-7 p-1 text-current bg-background/20 hover:bg-background/40"
              />
            </h4>
            <p className="font-medium text-sm">{content.message}</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="p-1 hover:bg-background/30 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
