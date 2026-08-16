import { PythonClient } from "../../services/pythonClient.js";

const DEFAULT_CONFIG = {
  rain_threshold_mm: 15,
  heat_threshold_c: 35,
  humidity_threshold_pct: 85,
};

export class WeatherRuleEngine {
  async evaluate(fieldId, forecasts, config = DEFAULT_CONFIG) {
    if (!forecasts || forecasts.length === 0) return [];
    // Call Python FastAPI for processing
    const flags = await PythonClient.evaluateWeatherRules(
      fieldId,
      forecasts,
      config,
    );
    return flags;
  }
}
