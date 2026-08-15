"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockWeatherProvider = void 0;
class MockWeatherProvider {
    async getForecast(lat, lng, fieldId) {
        const snapshots = [];
        const today = new Date();
        // Generate 7 days of realistic forecast
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            // Introduce a fake rain event on day 3
            const isRainEvent = i === 3;
            snapshots.push({
                field_id: fieldId,
                date: date.toISOString().split('T')[0],
                source: 'mock-weather-api',
                rainfall_mm: isRainEvent ? 25 : Math.floor(Math.random() * 2), // mm
                temp_min: 15 + Math.floor(Math.random() * 5),
                temp_max: 28 + Math.floor(Math.random() * 10), // Chance of heat event > 35
                humidity_pct: 40 + Math.floor(Math.random() * 40),
                forecast_confidence: i < 3 ? 'high' : 'medium',
                is_forecast: true,
                ingested_at: new Date().toISOString()
            });
        }
        return snapshots;
    }
    async getHistory(lat, lng, fieldId) {
        const snapshots = [];
        const today = new Date();
        // Generate last 30 days
        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            snapshots.push({
                field_id: fieldId,
                date: date.toISOString().split('T')[0],
                source: 'mock-weather-api',
                rainfall_mm: Math.floor(Math.random() * 10),
                temp_min: 12 + Math.floor(Math.random() * 8),
                temp_max: 25 + Math.floor(Math.random() * 10),
                humidity_pct: 50 + Math.floor(Math.random() * 30),
                forecast_confidence: 'high',
                is_forecast: false, // It's historical actual
                ingested_at: new Date().toISOString()
            });
        }
        return snapshots.reverse();
    }
}
exports.MockWeatherProvider = MockWeatherProvider;
