import { PythonClient } from "../../services/pythonClient.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const keys = GEMINI_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean);
const GEMINI_API_KEY = keys.length > 0 ? keys[0] : "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const REGEN_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export class RegenAI {
  /**
   * Delegates AI call for regenerative practices and crop planning.
   * Primary: Python AI service. Fallback: direct Gemini call.
   */
  async generatePlan(context) {
    console.log(
      "[RegenAI] Delegating plan generation to Python service for context:",
      context.crop_type,
    );

    // 1. Try Python AI service first
    try {
      const result = await PythonClient.generateRegenPlan(context);
      return {
        practices: result.practices,
        next_season_options: result.next_season_options,
        carbon_credits_estimate: result.carbon_credits_estimate,
        summary: result.summary,
      };
    } catch (pythonErr) {
      console.warn("[RegenAI] Python service unavailable, falling back to Gemini:", pythonErr.message);
    }

    // 2. Gemini fallback — generates a field-specific plan from context
    return this._generateWithGemini(context);
  }

  async _generateWithGemini(context) {
    const model = genAI.getGenerativeModel({ model: REGEN_MODEL });

    const prompt = `You are AgriMesh, an agricultural intelligence system specializing in regenerative farming.
Generate a regenerative agriculture plan for an Indian farmer with the following field context:

Crop type: ${context.crop_type ?? "unknown"}
Soil profile: ${context.soil ? JSON.stringify(context.soil) : "unavailable"}

Return ONLY valid JSON in this format:
{
  "practices": [
    {
      "id": "p1",
      "title": "Practice Name",
      "description": "How to do it",
      "effort_level": "low|medium|high",
      "reasoning": "Why it helps"
    }
  ],
  "next_season_options": [
    {
      "crop_type": "Crop Name",
      "variety": "Optional variety or null",
      "suitability_score": 85,
      "reasoning": "Why this rotation is good",
      "risk_factors": ["risk1"]
    }
  ],
  "carbon_credits_estimate": 0.0,
  "summary": "Brief regenerative plan summary for this field"
}`;

    let text;
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (err) {
      throw new Error(`[RegenAI] Gemini fallback failed: ${err.message}`);
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`[RegenAI] Gemini returned non-JSON: ${text.slice(0, 200)}`);

    try {
      return JSON.parse(match[0]);
    } catch {
      throw new Error(`[RegenAI] Could not parse Gemini JSON: ${match[0].slice(0, 200)}`);
    }
  }
}

export const regenAI = new RegenAI();
