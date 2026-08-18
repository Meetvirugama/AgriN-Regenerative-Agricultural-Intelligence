import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthScoreService } from "../modules/health-score/health-score.service.js";
import { satelliteStore } from "../modules/satellite/satellite.store.js";
import { cropStateRepo, fieldRepo } from "../db/repositories/farmerRepository.js";
import { weatherRepo } from "../db/repositories/weatherRepository.js";
import { soilRepo } from "../db/repositories/soilRepository.js";
import { PythonClient } from "../services/pythonClient.js";

// Mock dependencies
vi.mock("../modules/satellite/satellite.store", () => ({
  satelliteStore: {
    getLatestTile: vi.fn(),
    getLatestTrend: vi.fn(),
    getActiveAnomalies: vi.fn(),
  },
}));

vi.mock("../db/repositories/farmerRepository", () => ({
  cropStateRepo: {
    getCropState: vi.fn(),
  },
  fieldRepo: {
    findFieldById: vi.fn(),
  },
}));

vi.mock("../db/repositories/weatherRepository", () => ({
  weatherRepo: {
    getSnapshots: vi.fn(),
    getActiveFlags: vi.fn(),
  },
}));

vi.mock("../db/repositories/soilRepository", () => ({
  soilRepo: {
    getLatestProfile: vi.fn(),
  },
}));

vi.mock("../services/pythonClient", () => ({
  PythonClient: {
    computeHealthScore: vi.fn(),
  },
}));

describe("HealthScoreService", () => {
  const service = new HealthScoreService();

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup default happy-path mocks
    vi.mocked(satelliteStore.getLatestTile).mockResolvedValue({
      id: "t1",
      field_id: "f1",
      date: "2026-08-16",
      ndvi_avg: 0.8,
      cloudCoverPct: 0,
      resolution_m: 10,
    });
    vi.mocked(satelliteStore.getLatestTrend).mockResolvedValue({
      id: "tr1",
      field_id: "f1",
      start_date: "2026-08-16",
      end_date: "2026-08-16",
      trend: "improving",
      computed_at: "",
    });
    vi.mocked(satelliteStore.getActiveAnomalies).mockResolvedValue([]);
    vi.mocked(cropStateRepo.getCropState).mockResolvedValue({
      field_id: "f1",
      current_stage: "vegetative",
      last_updated: new Date().toISOString(),
    });

    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([]);
    vi.mocked(weatherRepo.getActiveFlags).mockResolvedValue([]);
    vi.mocked(soilRepo.getLatestProfile).mockResolvedValue(null);
    vi.mocked(fieldRepo.findFieldById).mockResolvedValue({
      id: "f1",
      farmer_id: "far1",
      crop_type: "wheat",
      crop_variety: "pbw343",
      sowing_date: "2026-06-01",
    });
  });

  it("should compute score deterministically from satellite, weather, and soil data", async () => {
    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([
      { is_forecast: false, rainfall_mm: 5, temp_max: 25, humidity_pct: 50 },
      { is_forecast: true, rainfall_mm: 10, temp_max: 25, humidity_pct: 50 },
    ]);

    const result = await service.computeScore("f1");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.category).toBeDefined();
  });
});
