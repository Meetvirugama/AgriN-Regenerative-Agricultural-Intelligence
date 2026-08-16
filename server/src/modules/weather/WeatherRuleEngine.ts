import { FieldWeatherSnapshot, WeatherEventFlag } from '../../models/Database';
import { PythonClient } from '../../services/pythonClient';

export interface RuleConfig {
  rain_threshold_mm: number;
  heat_threshold_c: number;
  humidity_threshold_pct: number;
}

const DEFAULT_CONFIG: RuleConfig = {
  rain_threshold_mm: 15,
  heat_threshold_c: 35,
  humidity_threshold_pct: 85,
};

export class WeatherRuleEngine {
  
  public async evaluate(fieldId: string, forecasts: FieldWeatherSnapshot[], config: RuleConfig = DEFAULT_CONFIG): Promise<WeatherEventFlag[]> {
    if (!forecasts || forecasts.length === 0) return [];
    
    // Call Python FastAPI for processing
    const flags = await PythonClient.evaluateWeatherRules(fieldId, forecasts, config);
    return flags;
  }
}
