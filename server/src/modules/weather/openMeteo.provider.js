import { MockWeatherProvider } from "./weather.provider.js";

// Open-Meteo free API — no key required
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";

/**
 * Open-Meteo provider.
 *
 * Uses the free Open-Meteo API (no API key required).
 * For forecast:  /forecast endpoint (7 days ahead)
 * For history:   /historical endpoint (last 30 days via ERA5 reanalysis)
 *
 * Field coordinates default to Punjab, India (30.9°N, 75.8°E) until
 * the fields table stores real lat/lng (Phase 7 enhancement).
 */
export class OpenMeteoProvider {
  defaultLat = 30.9;
  defaultLng = 75.8;
  timeout = 8000; // 8 seconds

  async fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok)
        throw new Error(
          `Open-Meteo API error: ${res.status} ${res.statusText}`,
        );
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  mapToSnapshots(fieldId, daily, isForecast) {
    return daily.time.map((date, i) => ({
      field_id: fieldId,
      date,
      source: "open-meteo",
      rainfall_mm: daily.precipitation_sum[i] ?? 0,
      temp_min: daily.temperature_2m_min[i] ?? 15,
      temp_max: daily.temperature_2m_max[i] ?? 28,
      humidity_pct: daily.relative_humidity_2m_max[i] ?? 60,
      forecast_confidence: isForecast
        ? i < 3
          ? "high"
          : i < 5
            ? "medium"
            : "low"
        : "high",
      is_forecast: isForecast,
      ingested_at: new Date().toISOString(),
    }));
  }

  async getForecast(lat, lng, fieldId) {
    const useLat = lat || this.defaultLat;
    const useLng = lng || this.defaultLng;

    const url =
      `${OPEN_METEO_BASE}/forecast?` +
      `latitude=${useLat}&longitude=${useLng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,weathercode` +
      `&forecast_days=7&timezone=Asia%2FKolkata`;

    const data = await this.fetchWithTimeout(url);
    return this.mapToSnapshots(fieldId, data.daily, true);
  }

  async getHistory(lat, lng, fieldId) {
    const useLat = lat || this.defaultLat;
    const useLng = lng || this.defaultLng;

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1); // yesterday

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);

    const fmt = (d) => d.toISOString().split("T")[0];

    const url =
      `${OPEN_METEO_BASE}/archive?` +
      `latitude=${useLat}&longitude=${useLng}` +
      `&start_date=${fmt(startDate)}&end_date=${fmt(endDate)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,weathercode` +
      `&timezone=Asia%2FKolkata`;

    const data = await this.fetchWithTimeout(url);
    return this.mapToSnapshots(fieldId, data.daily, false);
  }
}

/**
 * Factory — returns the real Open-Meteo provider in all environments.
 * Falls back to MockWeatherProvider if the env var USE_MOCK_WEATHER=true.
 */
export function createWeatherProvider() {
  if (process.env.USE_MOCK_WEATHER === "true") {
    console.log("[Weather] Using MockWeatherProvider (USE_MOCK_WEATHER=true)");
    return new MockWeatherProvider();
  }
  console.log("[Weather] Using OpenMeteoProvider (real API, no key required)");
  return new OpenMeteoProvider();
}
