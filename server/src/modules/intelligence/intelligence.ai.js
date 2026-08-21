import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("[Intelligence AI] GEMINI_API_KEY is missing.");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const responseSchema = {
  type: "array",
  minItems: 0,
  maxItems: 3,
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      type: {
        type: "string",
        enum: [
          "irrigation",
          "nutrient",
          "pest",
          "disease",
          "harvest",
          "monitoring",
          "weather",
          "general",
        ],
      },
      title: { type: "string" },
      desc: { type: "string" },
      field: { type: "string" },
      fieldId: { type: "string" },
      priority: {
        type: "string",
        enum: ["High", "Medium", "Low"],
      },
      confidence: { type: "number" },
    },
    required: [
      "id",
      "type",
      "title",
      "desc",
      "field",
      "fieldId",
      "priority",
      "confidence",
    ],
  },
};

const SYSTEM_INSTRUCTION = `
You are the AgriMesh agricultural intelligence reasoning engine.
Your job is to generate prioritized agricultural observations and recommendations from REAL field data.

IMPORTANT RULES:
1. Never invent measurements.
2. Never invent weather.
3. Never invent soil conditions.
4. Never invent satellite observations.
5. Never invent a health score.
6. If data is unavailable, say that it is unavailable. Do not replace it with assumptions.
7. Recommendations must reference the actual field.
8. Only recommend an action when the available evidence supports that action.
9. If evidence is weak, prefer "monitoring" rather than an unsupported intervention.
10. Do not invent pesticide/fungicide dosage, product names, application rates or legal restrictions.
11. Do not claim a disease is confirmed unless the data actually confirms it.
12. Do not use the same recommendation for every field simply because the farmer has multiple fields.
13. Prioritize the most important action first.
14. Maximum 3 recommendations.
15. Every recommendation must be understandable to a farmer.
16. Confidence must reflect evidence quality.
17. The fieldId MUST come directly from the supplied data.
18. The field name MUST come directly from the supplied data.

Return ONLY the requested structured output.
`;

export async function generateIntelligenceRecommendations(context, settings) {
  if (!GEMINI_API_KEY) {
    return [];
  }

  if (!context.fields?.length) {
    return [];
  }

  const prompt = `
FIELD INTELLIGENCE DATA:
${JSON.stringify(context, null, 2)}

Generate the most important recommendations for this farmer based ONLY on the supplied data.
If no recommendation is justified, return [].
  `;

  let finalSystemInstruction = SYSTEM_INSTRUCTION;
  
  if (settings) {
    const adviceInstruction = {
      Simple: "Use simple farmer-friendly language. Avoid technical terminology.",
      Detailed: "Explain the recommendation with reasons, observations and practical steps.",
      Expert: "Provide technically detailed agronomic reasoning, assumptions, uncertainty and relevant measurements.",
    };
    
    finalSystemInstruction += `\n\nAdvice level: ${settings.adviceLevel || 'Simple'}\n${adviceInstruction[settings.adviceLevel || 'Simple']}`;
    
    if (settings.language && settings.language !== 'English') {
      finalSystemInstruction += `\n\nRespond in ${settings.language}. Use terminology appropriate for farmers.`;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: finalSystemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const recommendations = JSON.parse(response.text);

    if (!Array.isArray(recommendations)) {
      return [];
    }

    /**
     * Final server-side validation.
     * Never blindly trust model output.
     */
    const validFieldIds = new Set(
      context.fields.map((field) => field.id)
    );

    return recommendations
      .filter((recommendation) => validFieldIds.has(recommendation.fieldId))
      .slice(0, 3);
  } catch (error) {
    console.error("[Intelligence AI] Gemini failed:", error);
    /**
     * AI failure should not destroy the
     * real field/weather/health response.
     */
    return [];
  }
}
