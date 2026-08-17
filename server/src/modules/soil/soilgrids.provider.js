/**
 * SoilGrids Provider
 *
 * Fetches real soil data from ISRIC SoilGrids REST API v2.
 * API: https://rest.isric.org/soilgrids/v2.0/properties/query
 *
 * Free, open data — 5 requests/minute recommended limit.
 * REST API is in beta and occasionally has outages; always fall back
 * to regional baselines when this provider fails.
 *
 * Properties fetched (0–30 cm depth):
 *   clay, sand, silt (texture)
 *   phh2o              (soil pH in water)
 *   soc                (soil organic carbon, dg/kg → convert to %)
 *   nitrogen           (total N, cg/kg)
 */

const SOILGRIDS_BASE = "https://rest.isric.org/soilgrids/v2.0/properties/query";
const TIMEOUT_MS = 10_000;

// Simple in-memory rate limiter: 5 calls per 60 seconds
const _callTimes = [];
function checkRateLimit() {
  const now = Date.now();
  // Remove calls older than 60s
  while (_callTimes.length && now - _callTimes[0] > 60_000) _callTimes.shift();
  if (_callTimes.length >= 5) {
    throw new Error("[SoilGrids] Rate limit: 5 calls per minute. Try again later.");
  }
  _callTimes.push(now);
}

/**
 * Map raw SoilGrids property values to our schema.
 */
function mapSoilData(properties) {
  const getValue = (prop, depth = "0-30cm") => {
    const layers = properties?.[prop]?.layers;
    if (!layers) return null;
    const layer = layers.find((l) => l.name === depth || l.name === `${depth}cm`);
    return layer?.values?.mean ?? null;
  };

  const clay = getValue("clay");     // g/kg → %
  const sand = getValue("sand");
  const silt = getValue("silt");
  const phRaw = getValue("phh2o");   // pH * 10
  const socRaw = getValue("soc");    // dg/kg → divide by 10 for g/kg, then /10 for %
  const nitrogenRaw = getValue("nitrogen"); // cg/kg → divide by 100 for g/kg

  // Determine texture class from clay/sand/silt percentages
  const clayPct = clay != null ? clay / 10 : null;
  const sandPct = sand != null ? sand / 10 : null;
  const siltPct = silt != null ? silt / 10 : null;

  const texture = classifyTexture(clayPct, sandPct, siltPct);
  const ph = phRaw != null ? phRaw / 10 : null;
  const organic_carbon_pct = socRaw != null ? socRaw / 100 : null; // dg/kg → %
  const organic_matter_pct = organic_carbon_pct != null ? organic_carbon_pct * 1.724 : null; // Van Bemmelen factor
  const nitrogen_g_per_kg = nitrogenRaw != null ? nitrogenRaw / 100 : null;

  return {
    texture,
    clay_pct: clayPct,
    sand_pct: sandPct,
    silt_pct: siltPct,
    ph,
    organic_carbon_pct,
    organic_matter_pct,
    nitrogen_level: classifyNPK(nitrogen_g_per_kg, "n"),
    phosphorus_level: "unknown", // SoilGrids free tier doesn't expose P directly
    potassium_level: "unknown",  // SoilGrids free tier doesn't expose K directly
    water_holding_capacity: estimateWHC(clayPct, organic_matter_pct),
    source: "soilgrids",
    confidence: 0.72,
  };
}

function classifyTexture(clay, sand, silt) {
  if (clay == null || sand == null) return "loam";
  if (clay >= 40) return "clay";
  if (sand >= 70) return "sandy";
  if (clay >= 27 && silt >= 28) return "clay_loam";
  if (silt >= 50 && clay < 27) return "silt_loam";
  if (sand >= 45 && clay < 20) return "sandy_loam";
  return "loam";
}

function classifyNPK(value, type) {
  if (value == null) return "unknown";
  if (type === "n") {
    if (value < 1.0) return "low";
    if (value < 2.0) return "medium";
    return "high";
  }
  return "medium";
}

function estimateWHC(clayPct, omPct) {
  if (clayPct == null) return "medium";
  const score = (clayPct / 100) * 0.6 + (omPct ?? 1) * 0.02;
  if (score < 0.2) return "low";
  if (score < 0.4) return "medium";
  return "high";
}

export class SoilGridsProvider {
  async fetchSoilProfile(lat, lng) {
    checkRateLimit();

    const properties = "clay,sand,silt,phh2o,soc,nitrogen";
    const depths = "0-30cm";
    const url =
      `${SOILGRIDS_BASE}?lon=${lng}&lat=${lat}` +
      `&property=${properties}` +
      `&depth=${depths}` +
      `&value=mean`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`SoilGrids API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return mapSoilData(data.properties);
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`SoilGrids request timed out after ${TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
