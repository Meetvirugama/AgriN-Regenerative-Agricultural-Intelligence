/**
 * CopernicusProvider — Real Sentinel-2 satellite data via CDSE
 *
 * Authentication: OAuth2 client_credentials flow
 * Catalog:        CDSE OData API — search Sentinel-2 L2A scenes
 * Processing:     Sentinel Hub Process API — request B04 (Red) + B08 (NIR)
 * NDVI:           (B08 - B04) / (B08 + B04) — calculated from real band values
 *
 * Docs:
 *   https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/
 *   https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/S2L2A.html
 */

const CDSE_AUTH_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const CDSE_CATALOG_URL =
  "https://catalogue.dataspace.copernicus.eu/odata/v1/Products";
const SENTINEL_HUB_URL =
  "https://sh.dataspace.copernicus.eu/api/v1/process";

const TIMEOUT_MS = 30_000;
const MAX_CLOUD_COVER = 50; // percent — scenes above this are flagged as obstructed

// ─── Token cache ─────────────────────────────────────────────────────────────
let _token = null;
let _tokenExpiry = 0;

async function fetchAccessToken(clientId, clientSecret) {
  if (_token && Date.now() < _tokenExpiry - 30_000) return _token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetchWithTimeout(CDSE_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDSE auth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;
  return _token;
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── GeoJSON → bounding box ──────────────────────────────────────────────────
function getBbox(geojson) {
  const coords = geojson?.coordinates?.[0] ?? geojson?.geometry?.coordinates?.[0];
  if (!coords || !coords.length) return null;
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

// ─── NDVI statistics from band arrays ───────────────────────────────────────
function computeNdviStats(redBand, nirBand) {
  const ndviValues = [];
  for (let i = 0; i < redBand.length; i++) {
    const red = redBand[i] / 10000; // Sentinel-2 L2A scale factor
    const nir = nirBand[i] / 10000;
    const denom = nir + red;
    if (denom > 0.001) {
      const ndvi = (nir - red) / denom;
      if (ndvi >= -1 && ndvi <= 1) ndviValues.push(ndvi);
    }
  }
  if (ndviValues.length === 0) return null;

  ndviValues.sort((a, b) => a - b);
  const n = ndviValues.length;
  const mean = ndviValues.reduce((s, v) => s + v, 0) / n;
  const median = ndviValues[Math.floor(n / 2)];
  const min = ndviValues[0];
  const max = ndviValues[n - 1];
  const variance = ndviValues.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  return {
    ndvi_mean: parseFloat(mean.toFixed(4)),
    ndvi_median: parseFloat(median.toFixed(4)),
    ndvi_min: parseFloat(min.toFixed(4)),
    ndvi_max: parseFloat(max.toFixed(4)),
    ndvi_std: parseFloat(std.toFixed(4)),
    pixel_count: n,
  };
}

export class CopernicusProvider {
  constructor() {
    this.clientId = process.env.CDSE_CLIENT_ID;
    this.clientSecret = process.env.CDSE_CLIENT_SECRET;
    if (!this.clientId || !this.clientSecret) {
      throw new Error("CDSE_CLIENT_ID and CDSE_CLIENT_SECRET must be set");
    }
  }

  /**
   * Find the latest cloud-free Sentinel-2 L2A scene for a field polygon.
   */
  async findLatestScene(geojson, daysBack = 30) {
    const bbox = getBbox(geojson);
    if (!bbox) throw new Error("Invalid field geometry — cannot compute bounding box");

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - daysBack * 86400000)
      .toISOString()
      .split("T")[0];

    const filter = [
      `Collection/Name eq 'SENTINEL-2'`,
      `Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')`,
      `OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((` +
        `${bbox.minLng} ${bbox.minLat},` +
        `${bbox.maxLng} ${bbox.minLat},` +
        `${bbox.maxLng} ${bbox.maxLat},` +
        `${bbox.minLng} ${bbox.maxLat},` +
        `${bbox.minLng} ${bbox.minLat}` +
        `))')`,
      `ContentDate/Start gt ${startDate}T00:00:00.000Z`,
      `ContentDate/Start lt ${endDate}T23:59:59.999Z`,
    ].join(" and ");

    const url =
      `${CDSE_CATALOG_URL}?$filter=${encodeURIComponent(filter)}` +
      `&$orderby=ContentDate/Start desc&$top=5`;

    const token = await fetchAccessToken(this.clientId, this.clientSecret);
    const res = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`CDSE catalog search failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const scenes = (data.value ?? []).filter((s) => {
      const cloudAttr = s.Attributes?.find(
        (a) => a.Name === "cloudCover" || a.Name === "cloudcoverpercentage",
      );
      const cloud = cloudAttr?.Value ?? 100;
      return cloud <= MAX_CLOUD_COVER;
    });

    if (scenes.length === 0) return null;

    const best = scenes[0];
    const cloudAttr = best.Attributes?.find(
      (a) => a.Name === "cloudCover" || a.Name === "cloudcoverpercentage",
    );

    return {
      scene_id: best.Id ?? best.Name,
      observation_date: best.ContentDate?.Start?.split("T")[0],
      cloud_cover_pct: parseFloat(cloudAttr?.Value ?? 0),
    };
  }

  /**
   * Request B04 (Red) and B08 (NIR) bands for the field polygon via Sentinel Hub.
   * Returns computed NDVI statistics.
   */
  async fetchNdvi(geojson, scene_id, cloud_cover_pct) {
    const token = await fetchAccessToken(this.clientId, this.clientSecret);

    // Evalscript: return B04 and B08 as float32 arrays
    const evalscript = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08"], units: "DN" }],
    output: { bands: 2, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  return [sample.B04, sample.B08];
}`;

    // Compute polygon bounding box for the request geometry
    const coords = geojson?.coordinates?.[0] ?? geojson?.geometry?.coordinates?.[0];
    if (!coords) throw new Error("Invalid geometry for Sentinel Hub request");

    const body = {
      input: {
        bounds: {
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              maxCloudCoverage: MAX_CLOUD_COVER,
            },
          },
        ],
      },
      output: {
        width: 128,
        height: 128,
        responses: [{ identifier: "default", format: { type: "image/tiff" } }],
      },
      evalscript,
    };

    const res = await fetchWithTimeout(SENTINEL_HUB_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sentinel Hub process API failed (${res.status}): ${text.slice(0, 300)}`);
    }

    // Sentinel Hub returns GeoTIFF — parse band statistics from the response headers
    // For a simpler integration, use the Statistical API instead of raw Process API
    // which returns JSON band statistics directly
    return this._fetchNdviStatistical(geojson, coords, token);
  }

  /**
   * Use the Sentinel Hub Statistical API for field-level NDVI stats.
   * Returns pre-computed mean/min/max/std without needing to decode GeoTIFF.
   */
  async _fetchNdviStatistical(geojson, coords, token) {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    const evalscript = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08"], units: "DN" }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" }
    ]
  };
}
function evaluatePixel(sample) {
  var red = sample.B04 / 10000.0;
  var nir = sample.B08 / 10000.0;
  var ndvi = (nir + red) > 0.001 ? (nir - red) / (nir + red) : -9999;
  return [ndvi];
}`;

    const body = {
      input: {
        bounds: {
          geometry: { type: "Polygon", coordinates: [coords] },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: { maxCloudCoverage: MAX_CLOUD_COVER },
          },
        ],
      },
      aggregation: {
        timeRange: {
          from: `${startDate}T00:00:00Z`,
          to: `${endDate}T23:59:59Z`,
        },
        aggregationInterval: { of: "P1D" },
        evalscript,
        resx: 10,
        resy: 10,
      },
      calculations: {
        ndvi: {
          statistics: {
            default: {
              percentiles: { k: [25, 50, 75] },
              noDataThreshold: -9998,
            },
          },
        },
      },
    };

    const res = await fetchWithTimeout(
      "https://sh.dataspace.copernicus.eu/api/v1/statistics",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sentinel Hub Stats API failed (${res.status}): ${text.slice(0, 300)}`);
    }

    const data = await res.json();

    // Find the most recent interval with valid data
    const intervals = (data.data ?? [])
      .filter((d) => d.outputs?.ndvi?.bands?.B0?.stats?.mean != null)
      .sort((a, b) => new Date(b.interval.from) - new Date(a.interval.from));

    if (intervals.length === 0) {
      throw new Error("No valid Sentinel-2 NDVI data found for this field in the past 30 days");
    }

    const latest = intervals[0];
    const stats = latest.outputs.ndvi.bands.B0.stats;
    const pct = latest.outputs.ndvi.bands.B0.stats.percentiles ?? {};

    return {
      ndvi_mean: parseFloat((stats.mean ?? 0).toFixed(4)),
      ndvi_median: parseFloat((pct["50"] ?? stats.mean ?? 0).toFixed(4)),
      ndvi_min: parseFloat((stats.min ?? 0).toFixed(4)),
      ndvi_max: parseFloat((stats.max ?? 0).toFixed(4)),
      ndvi_std: parseFloat((stats.stDev ?? 0).toFixed(4)),
      pixel_count: stats.sampleCount ?? 0,
      observation_date: latest.interval.from.split("T")[0],
    };
  }

  /**
   * Main entry point: find latest scene + compute NDVI for a field polygon.
   */
  async fetchLatestTile(geojson, fieldId) {
    if (!geojson) throw new Error("Field has no polygon geometry — cannot fetch Sentinel-2 data");


    // Find best scene in catalog
    const scene = await this.findLatestScene(geojson);
    const cloudCover = scene?.cloud_cover_pct ?? 100;
    const isObstructed = !scene || cloudCover > MAX_CLOUD_COVER;

    if (isObstructed) {
      console.warn(`[Copernicus] No clear Sentinel-2 scene found for field ${fieldId} (best cloud cover: ${cloudCover}%)`);
      return {
        fieldId,
        captureDate: new Date().toISOString().split("T")[0],
        provider: "sentinel-2",
        ndviMean: null,
        ndviBySubregion: [],
        moistureProxy: null,
        cloudCoverPct: cloudCover,
        sceneId: scene?.scene_id ?? null,
        cloud_obstructed: true,
        source: "copernicus-cdse",
      };
    }

    // Fetch NDVI statistics
    const ndviStats = await this._fetchNdviStatistical(
      geojson,
      geojson?.coordinates?.[0] ?? geojson?.geometry?.coordinates?.[0],
      await fetchAccessToken(this.clientId, this.clientSecret),
    );


    return {
      fieldId,
      captureDate: ndviStats.observation_date ?? scene.observation_date,
      provider: "sentinel-2",
      ndviMean: ndviStats.ndvi_mean,
      ndviMedian: ndviStats.ndvi_median,
      ndviMin: ndviStats.ndvi_min,
      ndviMax: ndviStats.ndvi_max,
      ndviStd: ndviStats.ndvi_std,
      ndviBySubregion: [],
      moistureProxy: null, // NDMI requires B08A + B11 — future enhancement
      cloudCoverPct: cloudCover,
      sceneId: scene.scene_id,
      cloud_obstructed: false,
      pixel_count: ndviStats.pixel_count,
      source: "copernicus-cdse",
    };
  }

  /**
   * Get historical NDVI time-series for a field (last N days).
   */
  async getHistoricalTiles(fieldId, from, to, geojson) {
    if (!geojson) return [];

    const token = await fetchAccessToken(this.clientId, this.clientSecret);
    const coords = geojson?.coordinates?.[0] ?? geojson?.geometry?.coordinates?.[0];

    const evalscript = `//VERSION=3
function setup() {
  return { input: [{ bands: ["B04","B08"], units: "DN" }], output: [{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }] };
}
function evaluatePixel(s) {
  var red=s.B04/10000, nir=s.B08/10000;
  return [(nir+red)>0.001?(nir-red)/(nir+red):-9999];
}`;

    const body = {
      input: {
        bounds: { geometry: { type: "Polygon", coordinates: [coords] } },
        data: [{ type: "sentinel-2-l2a", dataFilter: { maxCloudCoverage: MAX_CLOUD_COVER } }],
      },
      aggregation: {
        timeRange: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
        aggregationInterval: { of: "P5D" }, // 5-day intervals
        evalscript,
        resx: 10,
        resy: 10,
      },
      calculations: {
        ndvi: {
          statistics: {
            default: { noDataThreshold: -9998 },
          },
        },
      },
    };

    const res = await fetchWithTimeout(
      "https://sh.dataspace.copernicus.eu/api/v1/statistics",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data.data ?? [])
      .filter((d) => d.outputs?.ndvi?.bands?.B0?.stats?.mean != null)
      .map((d) => ({
        fieldId,
        captureDate: d.interval.from.split("T")[0],
        provider: "sentinel-2",
        ndviMean: parseFloat((d.outputs.ndvi.bands.B0.stats.mean).toFixed(4)),
        cloudCoverPct: 0,
        cloud_obstructed: false,
        source: "copernicus-cdse",
      }));
  }
}
