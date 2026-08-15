import { API_BASE as API_URL } from '../../../lib/apiClient';

export interface WeatherSnapshot {
  field_id: string;
  date: string;
  source: string;
  rainfall_mm: number;
  temp_min: number;
  temp_max: number;
  humidity_pct: number;
  forecast_confidence: 'high' | 'medium' | 'low';
  is_forecast: boolean;
}

export interface WeatherEventFlag {
  id: string;
  field_id: string;
  event_type: 'rain_expected' | 'heat_event' | 'dry_spell' | 'humidity_spike' | 'frost_warning';
  start_date: string;
  end_date: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface WeatherData {
  forecasts: WeatherSnapshot[];
  flags: WeatherEventFlag[];
}

export const weatherApi = {
  getForecast: async (fieldId: string): Promise<WeatherData> => {
    const response = await fetch(`${API_URL}/fields/${fieldId}/weather/forecast`);
    if (!response.ok) {
      throw new Error('Failed to fetch weather forecast');
    }
    return response.json();
  }
};
