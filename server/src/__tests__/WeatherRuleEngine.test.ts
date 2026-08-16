import { describe, it, expect } from 'vitest';
import { WeatherRuleEngine } from '../modules/weather/WeatherRuleEngine';
import { FieldWeatherSnapshot } from '../models/Database';

describe('WeatherRuleEngine', () => {
  const engine = new WeatherRuleEngine();

  it('should flag heavy rain when rainfall exceeds threshold', () => {
    const forecasts: FieldWeatherSnapshot[] = [
      {
        field_id: 'f1',
        date: '2026-08-16',
        source: 'open-meteo',
        temp_min: 20,
        temp_max: 30,
        rainfall_mm: 50, // above 40 (high severity)
        humidity_pct: 60,
        forecast_confidence: 'high',
        is_forecast: true,
        ingested_at: new Date().toISOString()
      }
    ];

    const flags = engine.evaluate('f1', forecasts);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0].event_type).toBe('rain_expected');
    expect(flags[0].severity).toBe('high');
  });

  it('should flag heat event when temp exceeds threshold', () => {
    const forecasts: FieldWeatherSnapshot[] = [
      {
        field_id: 'f1',
        date: '2026-08-16',
        source: 'open-meteo',
        temp_min: 25,
        temp_max: 38, // above 35 (medium severity heat event)
        rainfall_mm: 0,
        humidity_pct: 40,
        forecast_confidence: 'high',
        is_forecast: true,
        ingested_at: new Date().toISOString()
      }
    ];

    const flags = engine.evaluate('f1', forecasts);
    expect(flags.find(f => f.event_type === 'heat_event')).toBeDefined();
    expect(flags.find(f => f.event_type === 'heat_event')?.severity).toBe('medium');
  });

  it('should flag frost warning when temp is near freezing', () => {
    const forecasts: FieldWeatherSnapshot[] = [
      {
        field_id: 'f1',
        date: '2026-08-16',
        source: 'open-meteo',
        temp_min: 1, // <= 2 is medium severity frost
        temp_max: 10,
        rainfall_mm: 0,
        humidity_pct: 40,
        forecast_confidence: 'high',
        is_forecast: true,
        ingested_at: new Date().toISOString()
      }
    ];

    const flags = engine.evaluate('f1', forecasts);
    expect(flags.find(f => f.event_type === 'frost_warning')).toBeDefined();
    expect(flags.find(f => f.event_type === 'frost_warning')?.severity).toBe('medium');
  });

  it('should return no flags for normal weather', () => {
    const forecasts: FieldWeatherSnapshot[] = [
      {
        field_id: 'f1',
        date: '2026-08-16',
        source: 'open-meteo',
        temp_min: 15,
        temp_max: 25,
        rainfall_mm: 5,
        humidity_pct: 50,
        forecast_confidence: 'high',
        is_forecast: true,
        ingested_at: new Date().toISOString()
      }
    ];

    const flags = engine.evaluate('f1', forecasts);
    expect(flags.length).toBe(0);
  });
});
