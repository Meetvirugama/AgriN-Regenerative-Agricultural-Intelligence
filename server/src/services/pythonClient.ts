import FormData from 'form-data';
import fetch from 'node-fetch';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8001/api/v1';

export class PythonClient {
  
  static async identifyCrop(imageBuffer: Buffer, mimeType: string) {
    const form = new FormData();
    form.append('image', imageBuffer, { contentType: mimeType, filename: 'image.jpg' });

    const res = await fetch(`${PYTHON_API_URL}/crop/identify`, {
      method: 'POST',
      body: form
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async diagnoseDisease(imageBuffer: Buffer, mimeType: string, cropType: string, cropStage: string, recentWeather: string) {
    const form = new FormData();
    form.append('image', imageBuffer, { contentType: mimeType, filename: 'image.jpg' });
    form.append('crop_type', cropType);
    form.append('crop_stage', cropStage);
    form.append('recent_weather', recentWeather);

    const res = await fetch(`${PYTHON_API_URL}/disease/diagnose`, {
      method: 'POST',
      body: form
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }

  static async generateAdvisory(
    fieldId: string, 
    cropType: string, 
    cropStage: string, 
    healthScoreSummary: string, 
    weatherSummary: string, 
    soilSummary: string, 
    farmerLanguage: string = 'en'
  ) {
    const res = await fetch(`${PYTHON_API_URL}/advisory/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: fieldId,
        crop_type: cropType,
        crop_stage: cropStage,
        health_score_summary: healthScoreSummary,
        weather_summary: weatherSummary,
        soil_summary: soilSummary,
        farmer_language: farmerLanguage
      })
    });
    if (!res.ok) throw new Error(`Python AI Error: ${await res.text()}`);
    return res.json();
  }
}
