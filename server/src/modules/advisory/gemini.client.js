import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("[Gemini] GEMINI_API_KEY not set — advisory will fail at runtime.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
// Use env var so all Gemini callers can be standardized via a single config; defaults to gemini-1.5-flash
const MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

/**
 * Build the evidence-first advisory prompt.
 *
 * CRITICAL DESIGN RULE:
 *   Gemini receives verified, pre-computed data.
 *   It reasons and explains. It does NOT calculate.
 *   If data is UNAVAILABLE, it must say so — not estimate.
 */
function buildPrompt(evidence) {
  const w = evidence.weather;
  const s = evidence.satellite;
  const soil = evidence.soil;
  const crop = evidence.crop;

  const weatherBlock = w
    ? `WEATHER (next 72 hours):
  Max temperature: ${w.temp_max_72h ?? "UNAVAILABLE"}°C
  Total rainfall: ${w.rainfall_72h_mm ?? "UNAVAILABLE"}mm
  Humidity: ${w.humidity_pct ?? "UNAVAILABLE"}%
  Active warnings: ${w.flags?.length ? w.flags.map((f) => f.event_type).join(", ") : "none"}`
    : "WEATHER: UNAVAILABLE";

  const satelliteBlock = s
    ? s.data_quality === "unavailable_cloud_cover"
      ? `SATELLITE: UNAVAILABLE (cloud cover too high — last clear observation: ${s.days_since_clear ?? "unknown"} days ago)`
      : `SATELLITE (${s.data_source}):
  NDVI mean: ${s.ndvi_mean ?? "UNAVAILABLE"}
  NDVI trend: ${s.trend ?? "unknown"}
  Observation date: ${s.observation_date ?? "unknown"}
  Data quality: ${s.data_quality}
  ${s.disclaimer ? `NOTE: ${s.disclaimer}` : ""}`
    : "SATELLITE: UNAVAILABLE";

  const soilBlock = soil
    ? `SOIL (source: ${soil.source}, confidence: ${soil.confidence ?? "?"})${soil.source === "regional_inference" ? " ⚠ Regional estimate only" : ""}:
  Texture: ${soil.texture ?? "UNAVAILABLE"}
  pH: ${soil.ph ?? "UNAVAILABLE"}
  Organic matter: ${soil.organic_matter_pct != null ? soil.organic_matter_pct + "%" : "UNAVAILABLE"}
  Nitrogen: ${soil.nitrogen_level ?? "UNAVAILABLE"}
  Water holding capacity: ${soil.water_holding_capacity ?? "UNAVAILABLE"}`
    : "SOIL: UNAVAILABLE";

  const cropBlock = `CROP:
  Type: ${crop.crop_type ?? "UNAVAILABLE"}
  Variety: ${crop.crop_variety ?? "not specified"}
  Growth stage: ${crop.stage ?? "UNAVAILABLE"}
  Days since sowing: ${crop.days_since_sowing ?? "UNAVAILABLE"}
  Irrigation type: ${crop.irrigation_type ?? "not specified"}`;

  return `You are AgriMesh, an agricultural intelligence system.
Your task is to generate a field advisory for an Indian farmer.

STRICT RULES:
1. Reason ONLY from the data below. Do not invent numbers.
2. If a data point is marked UNAVAILABLE, acknowledge it — do not estimate.
3. If satellite data is simulated, say "simulated data" explicitly.
4. Every assertion must cite which data source supports it.
5. Use simple language a farmer can understand.
6. Be specific: name the crop, the field condition, the exact action.

---
${cropBlock}

${weatherBlock}

${satelliteBlock}

${soilBlock}
---

Respond ONLY with valid JSON in this exact format:
{
  "what": "One sentence: what is happening or at risk in this field right now?",
  "why": "Two sentences: why is this happening, with specific evidence cited.",
  "severity": "Low | Medium | High | Critical",
  "action": "Specific actionable recommendation the farmer should do.",
  "deadline": "When should the farmer act? (e.g. 'within 24 hours', 'within 3 days')",
  "monitor": "What should the farmer observe or check next?",
  "confidence": "high | medium | low",
  "confidence_reason": "One sentence explaining confidence level based on data quality.",
  "evidence": [
    { "source": "weather|satellite|soil|crop_stage", "finding": "specific data point used" }
  ]
}`;
}

/**
 * Call Gemini with the assembled evidence and parse the advisory response.
 */
export async function generateAdvisoryWithGemini(evidence) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = buildPrompt(evidence);

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    throw new Error(`Gemini API call failed: ${err.message}`);
  }

  // Extract JSON from response (model sometimes adds markdown fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
  }

  let advisory;
  try {
    advisory = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Could not parse Gemini JSON: ${jsonMatch[0].slice(0, 200)}`);
  }

  return advisory;
}
