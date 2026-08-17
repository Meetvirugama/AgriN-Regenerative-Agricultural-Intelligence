import { MockSatelliteProvider } from "./satellite.provider.js";
import { weatherRepo } from "../../db/repositories/weatherRepository.js";
import { query, queryOne, execute } from "../../db/connection.js";
import { layer1Service } from "../field/field.service.js";

/**
 * Satellite provider factory.
 *
 * When CDSE_CLIENT_ID + CDSE_CLIENT_SECRET are set, this will use the
 * real Copernicus Data Space Ecosystem Sentinel-2 API.
 * Until then, MockSatelliteProvider is used with a clear data badge.
 *
 * TODO Phase 3: import CopernicusProvider and wire here.
 */
function createSatelliteProvider() {
  if (process.env.CDSE_CLIENT_ID && process.env.CDSE_CLIENT_SECRET) {
    // Placeholder — swap in CopernicusProvider when credentials are available
    console.log("[Satellite] CDSE credentials found — real Sentinel-2 provider TBD");
  }
  console.warn("[Satellite] No CDSE credentials — using MockSatelliteProvider. Data is NOT real.");
  return new MockSatelliteProvider();
}

class SatelliteService {
  constructor() {
    this.provider = createSatelliteProvider();
  }

  /**
   * Fetch (or return cached) latest satellite tile for a field.
   * Returns the tile with cloud quality badge.
   */
  async getLatestForField(fieldId) {
    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error(`Field ${fieldId} not found`);

    // Check if we have a recent non-obstructed tile (< 6 days old)
    const cached = await queryOne(
      `SELECT id, field_id, capture_date::text AS observation_date,
              provider, ndvi_mean::float, ndvi_median::float,
              ndvi_min::float, ndvi_max::float, ndvi_std::float,
              moisture_proxy::float AS ndmi_mean,
              cloud_cover_pct::float, cloud_obstructed,
              scene_id, band_resolution_m, ingested_at::text
       FROM satellite_tiles
       WHERE field_id = $1
         AND ingested_at > NOW() - INTERVAL '6 days'
       ORDER BY ingested_at DESC
       LIMIT 1`,
      [fieldId],
    );

    if (cached) return this._formatTile(cached);

    // Fetch from provider (mock or real)
    const boundary = field.geojson ?? null;
    const raw = await this.provider.fetchLatestTile(boundary, fieldId);

    // Persist
    const saved = await this._saveTile(fieldId, raw);
    return this._formatTile(saved);
  }

  /**
   * Get NDVI time-series for a field (last N days, non-obstructed tiles only).
   * Also computes trend direction.
   */
  async getTimeseries(fieldId, days = 60) {
    const rows = await query(
      `SELECT id, capture_date::text AS observation_date,
              provider, ndvi_mean::float, cloud_cover_pct::float,
              cloud_obstructed, ingested_at::text
       FROM satellite_tiles
       WHERE field_id = $1
         AND cloud_obstructed = FALSE
         AND ingested_at > NOW() - INTERVAL '${days} days'
       ORDER BY capture_date ASC`,
      [fieldId],
    );

    const trend = this._computeTrend(rows.map((r) => r.ndvi_mean));

    return {
      fieldId,
      days,
      observations: rows,
      trend,
      count: rows.length,
    };
  }

  /**
   * Compute trend direction from an array of NDVI values.
   */
  _computeTrend(values) {
    if (values.length < 2) return "insufficient_data";
    const first = values.slice(0, Math.ceil(values.length / 2));
    const last = values.slice(Math.floor(values.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
    const delta = avgLast - avgFirst;
    if (delta > 0.03) return "improving";
    if (delta < -0.03) return "declining";
    return "stable";
  }

  /**
   * Format tile for API response with data provenance badge.
   */
  _formatTile(tile) {
    const isReal = tile.provider !== "mock";
    return {
      ...tile,
      data_source: isReal ? "sentinel-2" : "simulated",
      data_quality: tile.cloud_obstructed
        ? "unavailable_cloud_cover"
        : isReal
          ? "real"
          : "simulated",
      disclaimer: isReal
        ? null
        : "SIMULATED DATA — Sentinel-2 integration pending CDSE credentials",
    };
  }

  async _saveTile(fieldId, raw) {
    const isObstructed = (raw.cloudCoverPct ?? raw.cloud_cover_pct ?? 0) > 60;
    return queryOne(
      `INSERT INTO satellite_tiles
         (field_id, capture_date, provider, ndvi_mean, ndvi_by_subregion,
          moisture_proxy, cloud_cover_pct, tile_url, cloud_obstructed,
          scene_id, observation_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, field_id, capture_date::text AS observation_date,
                 provider, ndvi_mean::float, moisture_proxy::float AS ndmi_mean,
                 cloud_cover_pct::float, cloud_obstructed, scene_id, ingested_at::text`,
      [
        fieldId,
        raw.captureDate ?? raw.capture_date ?? new Date().toISOString().split("T")[0],
        raw.provider ?? "mock",
        raw.ndviMean ?? raw.ndvi_mean ?? 0,
        JSON.stringify(raw.ndviBySubregion ?? raw.ndvi_by_subregion ?? []),
        raw.moistureProxy ?? raw.moisture_proxy ?? 0,
        raw.cloudCoverPct ?? raw.cloud_cover_pct ?? 0,
        raw.tileUrl ?? null,
        isObstructed,
        raw.sceneId ?? raw.scene_id ?? null,
        raw.captureDate ?? raw.capture_date ?? new Date().toISOString().split("T")[0],
      ],
    );
  }
}

export const satelliteService = new SatelliteService();
