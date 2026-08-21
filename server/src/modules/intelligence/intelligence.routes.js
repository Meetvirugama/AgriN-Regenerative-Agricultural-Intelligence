import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../../db/connection.js";

const router = Router();

if (!process.env.GEMINI_API_KEY) {
  console.warn("[Intelligence] GEMINI_API_KEY not set — intelligence endpoint will fail at runtime.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
// Use unified GEMINI_MODEL env var (same as advisory, chat, disease modules)
const MODEL = "gemini-3.6-flash";

/**
 * GET /api/v1/intelligence
 * Fetches real field/health data from the DB and uses Gemini to generate
 * an aggregated intelligence summary with recommendations.
 */
router.get("/", async (req, res, next) => {
  try {
    const farmerId = req.farmer.sub;

    // ── 1. Fetch real fields ─────────────────────────────────────────────
    const fields = await query(
      `SELECT id, name, crop_type, crop_variety, sowing_date::text
       FROM fields WHERE farmer_id = $1 ORDER BY created_at ASC`,
      [farmerId]
    );

    // ── 2. Fetch latest health scores for each field ─────────────────────
    const healthRows = await query(
      `SELECT h.field_id, h.overall_score, h.computed_at::text
       FROM field_health_scores h
       INNER JOIN fields f ON f.id = h.field_id
       WHERE f.farmer_id = $1
       ORDER BY h.computed_at DESC`,
      [farmerId]
    ).catch(() => []); // table may not exist yet — degrade gracefully

    // ── 3. Fetch active alerts ───────────────────────────────────────────
    const alertRows = await query(
      `SELECT id, title, priority, type, field_id
       FROM alerts WHERE farmer_id = $1 AND resolved = false`,
      [farmerId]
    ).catch(() => []);

    // ── 4. Build stats ───────────────────────────────────────────────────
    const totalFields = fields.length;
    const healthByField = Object.fromEntries(healthRows.map(h => [h.field_id, h.overall_score]));
    const scores = Object.values(healthByField);
    const avgHealth = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const activeAlerts = alertRows.length;

    // ── 5. Build distribution ────────────────────────────────────────────
    const good     = scores.filter(s => s >= 70).length;
    const moderate = scores.filter(s => s >= 40 && s < 70).length;
    const poor     = scores.filter(s => s < 40).length;
    const total    = scores.length || 1;
    const healthDistribution = {
      good:     Math.round((good / total) * 100),
      moderate: Math.round((moderate / total) * 100),
      poor:     Math.round((poor / total) * 100),
    };

    // ── 6. Ask Gemini for top recommendations ────────────────────────────
    let topRecommendations = [];
    if (fields.length > 0) {
      const fieldSummaries = fields.map(f => {
        const score = healthByField[f.id];
        return `- ${f.name} (${f.crop_type}${f.crop_variety ? ` / ${f.crop_variety}` : ""}, sown ${f.sowing_date})${score != null ? `, health score: ${score}/100` : ""}`;
      }).join("\n");

      const alertSummary = alertRows.length
        ? alertRows.map(a => `- [${a.priority}] ${a.title} (type: ${a.type})`).join("\n")
        : "No active alerts.";

      const prompt = `You are AgriMesh, an agricultural AI intelligence system.
A farmer has the following fields:
${fieldSummaries}

Active alerts:
${alertSummary}

Generate exactly 3 prioritized recommendations for this farmer right now.
Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {
    "id": "rec-1",
    "type": "irrigation|nutrient|pest|disease|harvest|monitoring",
    "title": "Short action title",
    "desc": "One sentence explanation with specific field name and reason.",
    "field": "Field name",
    "priority": "High|Medium|Low"
  }
]`;

      try {
        const model = genAI.getGenerativeModel({ model: MODEL });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          topRecommendations = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiErr) {
        console.warn("[Intelligence] Gemini recommendations failed:", geminiErr.message);
        // Return empty — don't block the rest of the response
      }
    }

    res.json({
      stats: {
        totalFields,
        avgHealth,
        activeAlerts,
        recommendations: topRecommendations.length,
      },
      healthDistribution,
      topRecommendations,
    });
  } catch (err) {
    console.error("[Intelligence] Error:", err.message);
    next(err);
  }
});

export default router;

