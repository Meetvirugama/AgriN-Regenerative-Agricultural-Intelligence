import { db, FieldWeatherSnapshot, WeatherEventFlag } from '../models/Database';
import { IWeatherProvider, MockWeatherProvider } from './weather/WeatherProvider';
import { WeatherRuleEngine } from './weather/WeatherRuleEngine';
import { layer1Service } from './Layer1Service';

class Layer3Service {
  private provider: IWeatherProvider;
  private ruleEngine: WeatherRuleEngine;

  constructor() {
    this.provider = new MockWeatherProvider();
    this.ruleEngine = new WeatherRuleEngine();
  }

  public async fetchAndStoreForecast(fieldId: string): Promise<{ forecasts: FieldWeatherSnapshot[], flags: WeatherEventFlag[] }> {
    const field = layer1Service.getField(fieldId);
    if (!field) {
      throw new Error(`Field ${fieldId} not found`);
    }

    // Coordinates are mocked in Layer 1, so we just pass dummy values
    const forecasts = await this.provider.getForecast(0, 0, fieldId);
    
    // Store in DB
    db.weatherSnapshots.set(fieldId, forecasts);

    // Evaluate rules to generate flags
    const flags = this.ruleEngine.evaluate(fieldId, forecasts);
    db.weatherFlags.set(fieldId, flags);

    return { forecasts, flags };
  }

  public getLocalizedForecast(fieldId: string) {
    const forecasts = db.weatherSnapshots.get(fieldId) || [];
    const flags = db.weatherFlags.get(fieldId) || [];
    return { forecasts, flags };
  }

  public async getFieldWeatherHistory(fieldId: string): Promise<FieldWeatherSnapshot[]> {
    return await this.provider.getHistory(0, 0, fieldId);
  }
}

export const layer3Service = new Layer3Service();
