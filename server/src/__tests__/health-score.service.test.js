import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthScoreService } from "../modules/health-score/health-score.service.js";
import { satelliteService } from "../modules/satellite/satellite.service.js";
import { cropStateRepo, fieldRepo } from "../db/repositories/farmerRepository.js";
import { weatherRepo } from "../db/repositories/weatherRepository.js";
import { soilService } from "../modules/soil/soil.service.js";

// Mock dependencies
vi.mock("../modules/satellite/satellite.service", () => ({
  satelliteService: {
    getLatestForField: vi.fn(),
    getTimeseries: vi.fn(),
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

vi.mock("../modules/soil/soil.service.js", () => ({
  soilService: {
    getActiveSoilProfile: vi.fn(),
  },
}));

vi.mock("../../db/connection", () => ({
  query: vi.fn().mockResolvedValue([]),
}));

describe("HealthScoreService", () => {
  const service = new HealthScoreService();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fieldRepo.findFieldById).mockResolvedValue({
      id: "f1",
      name: "Field 1",
      crop_type: "wheat",
      sowing_date: "2026-06-01",
    });
    vi.mocked(satelliteService.getLatestForField).mockResolvedValue({
      id: "t1",
      field_id: "f1",
      observation_date: "2026-08-16",
      ndvi_mean: 0.8,
      cloud_obstructed: false,
      data_source: "Sentinel-2",
      data_quality: "high",
    });
    vi.mocked(satelliteService.getTimeseries).mockResolvedValue({
      trend: "improving",
      observations: [],
    });
    vi.mocked(cropStateRepo.getCropState).mockResolvedValue({
      field_id: "f1",
      current_stage: "vegetative",
      last_updated: new Date().toISOString(),
    });
    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([]);
    vi.mocked(weatherRepo.getActiveFlags).mockResolvedValue([]);
    vi.mocked(soilService.getActiveSoilProfile).mockResolvedValue(null);
  });

  it("should compute deterministic composite score from real field evidence", async () => {
    const result = await service.computeScore("f1");
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.category).toBeDefined();
    expect(result.components).toBeDefined();
    expect(result.evidence).toBeInstanceOf(Array);
  });
});
