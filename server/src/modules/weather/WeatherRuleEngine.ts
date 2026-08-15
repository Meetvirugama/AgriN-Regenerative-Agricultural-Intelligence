import { FieldWeatherSnapshot, WeatherEventFlag } from '../../models/Database';

interface RuleConfig {
  rain_threshold_mm: number;
  heat_threshold_c: number;
  humidity_threshold_pct: number;
}

// Config-driven rule engine (Layer 02 stages could modulate this later)
const DEFAULT_CONFIG: RuleConfig = {
  rain_threshold_mm: 15,
  heat_threshold_c: 35,
  humidity_threshold_pct: 85,
};

export class WeatherRuleEngine {
  
  public evaluate(fieldId: string, forecasts: FieldWeatherSnapshot[], config: RuleConfig = DEFAULT_CONFIG): WeatherEventFlag[] {
    const flags: WeatherEventFlag[] = [];
    
    // Check for heavy rain
    const rainDays = forecasts.filter(f => f.rainfall_mm >= config.rain_threshold_mm);
    if (rainDays.length > 0) {
      flags.push({
        id: `flag_${fieldId}_rain_${rainDays[0].date}`,
        field_id: fieldId,
        event_type: 'rain_expected',
        start_date: rainDays[0].date,
        end_date: rainDays[rainDays.length - 1].date,
        severity: rainDays.some(f => f.rainfall_mm > 40) ? 'high' : 'medium',
        message: rainDays.some(f => f.rainfall_mm > 40) ? 'Heavy rainfall expected this week.' : 'Rain expected in the coming days.',
        generated_at: new Date().toISOString()
      });
    }
    
    // Check for heat event
    const heatDays = forecasts.filter(f => f.temp_max >= config.heat_threshold_c);
    if (heatDays.length > 0) {
      flags.push({
        id: `flag_${fieldId}_heat_${heatDays[0].date}`,
        field_id: fieldId,
        event_type: 'heat_event',
        start_date: heatDays[0].date,
        end_date: heatDays[heatDays.length - 1].date,
        severity: heatDays.some(f => f.temp_max > 40) ? 'high' : 'medium',
        message: 'Extreme heat warning. Temperatures exceeding safe thresholds.',
        generated_at: new Date().toISOString()
      });
    }
    
    // Check for extreme humidity (disease risk)
    const humidDays = forecasts.filter(f => f.humidity_pct >= config.humidity_threshold_pct);
    if (humidDays.length > 0) {
      flags.push({
        id: `flag_${fieldId}_humidity_${humidDays[0].date}`,
        field_id: fieldId,
        event_type: 'humidity_spike',
        start_date: humidDays[0].date,
        end_date: humidDays[humidDays.length - 1].date,
        severity: 'medium',
        message: 'High humidity detected. Increased disease risk.',
        generated_at: new Date().toISOString()
      });
    }
    
    // Check for frost warning
    const frostDays = forecasts.filter(f => f.temp_min <= 2);
    if (frostDays.length > 0) {
      flags.push({
        id: `flag_${fieldId}_frost_${frostDays[0].date}`,
        field_id: fieldId,
        event_type: 'frost_warning',
        start_date: frostDays[0].date,
        end_date: frostDays[frostDays.length - 1].date,
        severity: frostDays.some(f => f.temp_min <= 0) ? 'high' : 'medium',
        message: 'Frost warning. High risk of crop damage.',
        generated_at: new Date().toISOString()
      });
    }
    
    return flags;
  }
}
