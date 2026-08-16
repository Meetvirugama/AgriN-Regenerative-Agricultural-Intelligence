import { describe, it, expect, vi, beforeEach } from "vitest";
import { WeatherRuleEngine } from "../modules/weather/WeatherRuleEngine.js";
import { PythonClient } from "../services/pythonClient.js";

vi.mock("../services/pythonClient", () => ({
  PythonClient: {
    evaluateWeatherRules: vi.fn(),
  },
}));

describe("WeatherRuleEngine", () => {
  const engine = new WeatherRuleEngine();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to PythonClient for evaluation", async () => {
    const forecasts = [
      {
        field_id: "f1",
        date: "2026-08-16",
        source: "open-meteo",
        temp_min: 20,
        temp_max: 30,
        rainfall_mm: 50,
        humidity_pct: 60,
        forecast_confidence: "high",
        is_forecast: true,
        ingested_at: new Date().toISOString(),
      },
    ];

    vi.mocked(PythonClient.evaluateWeatherRules).mockResolvedValue([
      { event_type: "rain_expected", severity: "high" },
    ]);

    const flags = await engine.evaluate("f1", forecasts);
    expect(PythonClient.evaluateWeatherRules).toHaveBeenCalledWith(
      "f1",
      forecasts,
      expect.any(Object),
    );
    expect(flags.length).toBe(1);
    expect(flags[0].event_type).toBe("rain_expected");
  });

  it("should return empty array if no forecasts provided", async () => {
    const flags = await engine.evaluate("f1", []);
    expect(flags.length).toBe(0);
    expect(PythonClient.evaluateWeatherRules).not.toHaveBeenCalled();
  });
});
