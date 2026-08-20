import FormData from "form-data";
import fetch from "node-fetch";

const PYTHON_API_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001/api/v1";

export class PythonClient {
  static async identifyCrop(imageBuffer, mimeType) {
    const form = new FormData();
    form.append("image", imageBuffer, {
      contentType: mimeType,
      filename: "image.jpg",
    });

    const res = await fetch(`${PYTHON_API_URL}/crop/identify`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async diagnoseDisease(
    imageBuffer,
    mimeType,
    cropType,
    cropStage,
    recentWeather,
  ) {
    const form = new FormData();
    form.append("image", imageBuffer, {
      contentType: mimeType,
      filename: "image.jpg",
    });
    form.append("crop_type", cropType);
    form.append("crop_stage", cropStage);
    form.append("recent_weather", recentWeather);

    const res = await fetch(`${PYTHON_API_URL}/disease/diagnose`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async generateAdvisory(
    fieldId,
    cropType,
    cropStage,
    healthScoreSummary,
    weatherSummary,
    soilSummary,
    farmerLanguage = "en",
  ) {
    const res = await fetch(`${PYTHON_API_URL}/advisory/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_id: fieldId,
        crop_type: cropType,
        crop_stage: cropStage,
        health_score_summary: healthScoreSummary,
        weather_summary: weatherSummary,
        soil_summary: soilSummary,
        farmer_language: farmerLanguage,
      }),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  /**
   * Calculate crop phenology (GDD + stage).
   * @param {string} sowingDate - ISO date string
   * @param {object} calendar - crop calendar with stages
   * @param {object} [temperatureHistory] - optional { temp_max_c: number[], temp_min_c: number[] }
   *   from weather_snapshots. When provided, real GDD is computed instead of the 15/day stub.
   */
  static async calculatePhenology(sowingDate, calendar, temperatureHistory = null) {
    const res = await fetch(`${PYTHON_API_URL}/phenology/gdd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sowing_date: sowingDate,
        calendar: calendar,
        temp_max_c: temperatureHistory?.temp_max_c ?? null,
        temp_min_c: temperatureHistory?.temp_min_c ?? null,
      }),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async evaluateWeatherRules(fieldId, forecasts, config) {
    const res = await fetch(`${PYTHON_API_URL}/weather-rules/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_id: fieldId,
        forecasts: forecasts,
        config: config,
      }),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async computeHealthScore(payload) {
    const res = await fetch(`${PYTHON_API_URL}/health-score/compute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async processSatelliteData(fieldId, currentTile, history) {
    const res = await fetch(`${PYTHON_API_URL}/satellite/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_id: fieldId,
        current_tile: currentTile,
        history: history,
      }),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async generateRegenPlan(context) {
    const res = await fetch(`${PYTHON_API_URL}/regen/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async parseSoilReport(imageBuffer, mimeType) {
    const form = new FormData();
    form.append("image", imageBuffer, {
      contentType: mimeType,
      filename: "soil_report.jpg",
    });

    const res = await fetch(`${PYTHON_API_URL}/vision/parse-soil-report`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async getGlobalInsights(fieldId) {
    const res = await fetch(
      `${PYTHON_API_URL}/cross-border/insights/${fieldId}`,
    );
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async transcribeAudio(audioBuffer, languageCode) {
    const form = new FormData();
    form.append("audio", audioBuffer, {
      contentType: "audio/wav",
      filename: "audio.wav",
    });
    form.append("languageCode", languageCode);

    const res = await fetch(`${PYTHON_API_URL}/voice/stt`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async synthesizeSpeech(text, languageCode) {
    const res = await fetch(`${PYTHON_API_URL}/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, languageCode }),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async assessClimateRisk(payload) {
    const res = await fetch(`${PYTHON_API_URL}/climate/risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }
}
