import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthScoreService } from '../modules/health-score/health-score.service';
import { satelliteStore } from '../modules/satellite/satellite.store';
import { cropStateRepo } from '../db/repositories/farmerRepository';
import { weatherRepo } from '../db/repositories/weatherRepository';
import { soilRepo } from '../db/repositories/soilRepository';

// Mock dependencies
vi.mock('../modules/satellite/satellite.store', () => ({
  satelliteStore: {
    getLatestTile: vi.fn(),
    getLatestTrend: vi.fn(),
    getActiveAnomalies: vi.fn(),
  }
}));

vi.mock('../db/repositories/farmerRepository', () => ({
  cropStateRepo: {
    getCropState: vi.fn(),
  }
}));

vi.mock('../db/repositories/weatherRepository', () => ({
  weatherRepo: {
    getSnapshots: vi.fn(),
    getActiveFlags: vi.fn(),
  }
}));

vi.mock('../db/repositories/soilRepository', () => ({
  soilRepo: {
    getLatestProfile: vi.fn(),
  }
}));

describe('HealthScoreService', () => {
  const service = new HealthScoreService();

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default happy-path mocks
    vi.mocked(satelliteStore.getLatestTile).mockResolvedValue({
      id: 't1', field_id: 'f1', date: '2026-08-16', ndvi_avg: 0.8,
      cloudCoverPct: 0, resolution_m: 10
    } as any);
    vi.mocked(satelliteStore.getLatestTrend).mockResolvedValue({
      id: 'tr1', field_id: 'f1', start_date: '2026-08-16', end_date: '2026-08-16', trend: 'improving', computed_at: ''
    } as any);
    vi.mocked(satelliteStore.getActiveAnomalies).mockResolvedValue([]);
    
    vi.mocked(cropStateRepo.getCropState).mockResolvedValue({
      field_id: 'f1',
      current_stage: 'vegetative',
      last_updated: new Date().toISOString()
    } as any);

    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([]);
    vi.mocked(weatherRepo.getActiveFlags).mockResolvedValue([]);
    vi.mocked(soilRepo.getLatestProfile).mockResolvedValue(null);
  });

  it('should compute a high overall score when conditions are optimal', async () => {
    // Optimal conditions
    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([
      { is_forecast: false, rainfall_mm: 5, temp_max: 25, humidity_pct: 50 } as any,
      { is_forecast: true, rainfall_mm: 10, temp_max: 25, humidity_pct: 50 } as any,
    ]);

    const score = await service.computeScore('f1');
    
    expect(score.crop_health.value).toBe('Good');
    expect(score.crop_health.severity).toBe('green');
  });

  it('should lower score significantly if extreme heat flag is active', async () => {
    // Heat stress condition
    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([
      { is_forecast: true, rainfall_mm: 0, temp_max: 42, humidity_pct: 20 } as any,
    ]);
    vi.mocked(weatherRepo.getActiveFlags).mockResolvedValue([
      { event_type: 'heat_event' } as any
    ]);

    const score = await service.computeScore('f1');
    
    // We expect weather risk to be elevated (amber)
    expect(score.weather_risk.severity).toBe('amber');
    expect(score.crop_health.severity).toBe('amber');
    expect(score.crop_health.value).toBe('Moderate');
  });

  it('should flag disease risk during high humidity and rainfall', async () => {
    // Disease risk: high humidity + recent rain
    vi.mocked(cropStateRepo.getCropState).mockResolvedValue({
      current_stage: 'flowering'
    } as any);
    
    vi.mocked(weatherRepo.getSnapshots).mockResolvedValue([
      { is_forecast: false, rainfall_mm: 20, temp_max: 28, humidity_pct: 90 } as any,
    ]);

    const score = await service.computeScore('f1');
    
    expect(score.disease_risk.severity).toBe('amber');
    expect(score.disease_risk.value).toBe('Elevated Risk');
  });
});
