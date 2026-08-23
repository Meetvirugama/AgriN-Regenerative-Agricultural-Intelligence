import FormData from "form-data";
import fetch from "node-fetch";

const PYTHON_API_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001/api/v1";

export class PythonClient {
  static async _safeFetch(endpoint, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${PYTHON_API_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorText = "Unknown error";
        try {
          errorText = await res.text();
        } catch (e) {
          // ignore
        }
        throw new Error(`Python AI Error (${res.status}): ${errorText}`);
      }

      // Voice TTS returns raw buffer sometimes, but we always expect JSON in this bridge currently
      // Except for specific endpoints? Looking at original code, ALL end with `return res.json()`.
      return await res.json();
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`Python AI Error: Request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static async identifyCrop(imageBuffer, mimeType) {
    const form = new FormData();
    form.append("image", imageBuffer, {
      contentType: mimeType,
      filename: "image.jpg",
    });

    return this._safeFetch("/crop/identify", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
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

    return this._safeFetch("/disease/diagnose", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
  }

  static async generateAdvisory(
    fieldId,
    cropType,
    cropStage,
    satelliteSummary,
    weatherSummary,
    soilSummary,
    farmerLanguage = "en",
  ) {
    return this._safeFetch("/advisory/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_id: fieldId,
        crop_type: cropType,
        crop_stage: cropStage,
        satellite_summary: satelliteSummary,
        weather_summary: weatherSummary,
        soil_summary: soilSummary,
        farmer_language: farmerLanguage,
      }),
    });
  }

  static async calculatePhenology(sowingDate, calendar, temperatureHistory = null) {
    return this._safeFetch("/phenology/gdd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sowing_date: sowingDate,
        calendar: calendar,
        temp_max_c: temperatureHistory?.temp_max_c ?? null,
        temp_min_c: temperatureHistory?.temp_min_c ?? null,
      }),
    });
  }

  static async evaluateWeatherRules(fieldId, forecasts, config) {
    return this._safeFetch("/weather/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_id: fieldId,
        forecasts: forecasts,
        config: config,
      }),
    });
  }

  static async computeHealthScore(payload) {
    return this._safeFetch("/health-score/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  static async processSatelliteData(fieldId, currentTile, history) {
    return this._safeFetch("/satellite/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_id: fieldId,
        current_tile: currentTile,
        history: history,
      }),
    });
  }

  static async generateRegenPlan(context) {
    return this._safeFetch("/regenerative/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
  }

  static async parseSoilReport(imageBuffer, mimeType) {
    const form = new FormData();
    form.append("image", imageBuffer, {
      contentType: mimeType,
      filename: "soil_report.jpg",
    });

    return this._safeFetch("/soil/parse-soil-report", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
  }

  static async getGlobalInsights(fieldId) {
    return this._safeFetch(`/cross-border/insights/${fieldId}`);
  }

  static async transcribeAudio(audioBuffer, languageCode) {
    const form = new FormData();
    form.append("audio", audioBuffer, {
      contentType: "audio/wav",
      filename: "audio.wav",
    });
    form.append("languageCode", languageCode);

    return this._safeFetch("/voice/stt", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
  }

  static async synthesizeSpeech(text, languageCode) {
    return this._safeFetch("/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, languageCode }),
    });
  }

  static async assessClimateRisk(payload) {
    return this._safeFetch("/climate-risk/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  static async chatAgent(sessionId, message) {
    return this._safeFetch("/voice/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message }),
    });
  }
}
