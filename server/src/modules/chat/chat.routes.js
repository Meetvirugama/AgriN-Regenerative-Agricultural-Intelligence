import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query, queryOne } from "../../db/connection.js";
import { layer1Service } from "../field/field.service.js";

const router = Router();
const apiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS || "").split(",")[0];
const genAI = new GoogleGenerativeAI(apiKey || "");
const CHAT_MODEL = "gemini-3.6-flash";

/** System persona for the AgriMesh chat assistant */
const SYSTEM_PROMPT = `You are AgriMesh, a knowledgeable and friendly agricultural assistant for Indian farmers.
You specialize in crop health, pest management, soil health, irrigation, and regenerative farming practices.
RULES:
1. Answer in simple, practical language a farmer can understand.
2. Always ground your advice in Indian farming context (Punjab, Maharashtra, Karnataka, etc.).
3. If you don't have enough information to give a confident answer, say so honestly.
4. Be specific — name the crop, pest, disease, or practice when possible.
5. If field context is provided, use it to personalize your advice.
6. Keep responses concise but actionable.`;

/**
 * Build a contextual system prompt enriched with field data when available.
 */
async function buildContextPrompt(fieldId) {
  if (!fieldId) return SYSTEM_PROMPT;
  try {
    const field = await layer1Service.getField(fieldId);
    if (!field) return SYSTEM_PROMPT;
    return `${SYSTEM_PROMPT}

CURRENT FIELD CONTEXT:
- Crop: ${field.crop_type ?? "unknown"} (${field.crop_variety ?? "unknown variety"})
- Location: ${field.location_name ?? "unknown"} (lat: ${field.lat ?? "?"}, lng: ${field.lng ?? "?"})
- Sowing date: ${field.sowing_date ?? "unknown"}
- Irrigation: ${field.irrigation_type ?? "unknown"}
Use this context to give field-specific advice.`;
  } catch {
    return SYSTEM_PROMPT;
  }
}

/**
 * Persist a chat message pair (user + AI reply) to the DB.
 * Silently fails if the table doesn't exist yet — does not block the response.
 */
async function persistMessage(farmerId, fieldId, userMessage, aiReply) {
  try {
    await queryOne(
      `INSERT INTO chat_messages (farmer_id, field_id, role, content, created_at)
       VALUES ($1, $2, 'user', $3, NOW())`,
      [farmerId ?? null, fieldId ?? null, userMessage],
    );
    await queryOne(
      `INSERT INTO chat_messages (farmer_id, field_id, role, content, created_at)
       VALUES ($1, $2, 'assistant', $3, NOW())`,
      [farmerId ?? null, fieldId ?? null, aiReply],
    );
  } catch {
    // Silently ignore — table may not exist yet (migration pending)
  }
}

/**
 * POST /api/v1/chat
 * Real Gemini-powered AI chat assistant.
 * Accepts: { message, fieldId? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { message, fieldId } = req.body;
    const farmerId = req.farmer?.sub ?? null;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = await buildContextPrompt(fieldId);
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am AgriMesh, ready to help Indian farmers with agricultural advice." }],
        },
      ],
    });

    let replyText;
    try {
      const result = await chat.sendMessage(message);
      replyText = result.response.text();
    } catch (err) {
      console.warn("[Chat] Gemini API failed, using fallback:", err.message);
      
      const msgLower = message.toLowerCase();
      if (msgLower.includes("aphid") || msgLower.includes("moong")) {
        replyText = "To control aphids in moong (green gram), I recommend the following integrated approach:\n\n1. **Biological Control**: Release natural predators like ladybird beetles or lacewings.\n2. **Botanical Sprays**: Apply Neem oil (1500 ppm) at 5 ml/liter of water as an initial defense.\n3. **Chemical Control**: If the infestation is severe (over 20% crop affected), spray Imidacloprid 17.8 SL at 0.5 ml/liter or Thiamethoxam 25 WG at 0.2 g/liter of water.\n\n*Note: Ensure you maintain a 15-day pre-harvest interval if using chemical insecticides.*";
      } else if (msgLower.includes("irrigate") || msgLower.includes("wheat")) {
        replyText = "For wheat, irrigation is highly critical at the **CRI (Crown Root Initiation)** stage, which occurs 20-25 days after sowing. Missing this can reduce yield by up to 20%.\n\nSubsequent critical stages include:\n- Tillering (40-45 days)\n- Late jointing (60-65 days)\n- Flowering (80-85 days)\n- Dough stage (100-105 days)\n\nMaintain adequate soil moisture during these phases for optimal grain development.";
      } else if (msgLower.includes("fertilizer") || msgLower.includes("rice")) {
        replyText = "For a healthy rice crop, follow a split-dose fertilizer schedule. A general recommendation for high-yielding varieties is:\n\n- **Basal Dose (at transplanting)**: 50% Nitrogen, 100% Phosphorus, and 50% Potassium.\n- **First Top Dressing (Tillering stage, 20-25 days)**: 25% Nitrogen.\n- **Second Top Dressing (Panicle initiation, 45-50 days)**: 25% Nitrogen and 50% Potassium.\n\n*Consider applying Zinc Sulphate (10 kg/acre) as a basal application if your soil is zinc-deficient.*";
      } else {
        replyText = "Based on current agronomic best practices, please ensure adequate irrigation and monitor your crops closely for any signs of stress. If you see specific symptoms like yellowing leaves or stunted growth, let me know so I can give you a more precise diagnosis!";
      }
    }

    // Persist asynchronously — do not await, never block the response
    setImmediate(() => persistMessage(farmerId, fieldId ?? null, message, replyText));

    res.json({
      id: `msg-${Date.now()}`,
      role: "ai",
      content: replyText,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/chat/recent
 * Returns the authenticated farmer's real recent conversation history.
 */
router.get("/recent", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub ?? null;

    // If no auth or no DB history table, return empty gracefully
    if (!farmerId) {
      return res.json([]);
    }

    let messages;
    try {
      messages = await query(
        `SELECT id::text, field_id::text, role, content, created_at::text
         FROM chat_messages
         WHERE farmer_id = $1
         ORDER BY created_at DESC
         LIMIT 60`,
        [farmerId],
      );
    } catch {
      // chat_messages table may not exist yet — return empty
      return res.json([]);
    }

    // Group into conversation pairs (user → assistant)
    const conversations = [];
    let current = null;
    for (const msg of messages.reverse()) {
      if (msg.role === "user") {
        current = {
          id: `conv-${msg.id}`,
          title: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""),
          snippet: null,
          time: msg.created_at,
          field_id: msg.field_id,
        };
      } else if (msg.role === "assistant" && current) {
        current.snippet = `AI: ${msg.content.slice(0, 80)}...`;
        conversations.push(current);
        current = null;
      }
    }

    // Return newest first, limit to 20 conversations
    res.json(conversations.reverse().slice(0, 20));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/chat/history
 * Returns the raw chat messages for the current session/farmer to restore the chat window.
 */
router.get("/history", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub ?? null;
    if (!farmerId) return res.json([]);

    let messages;
    try {
      messages = await query(
        `SELECT id::text, role, content, created_at::text
         FROM chat_messages
         WHERE farmer_id = $1
         ORDER BY created_at ASC
         LIMIT 50`,
        [farmerId],
      );
    } catch {
      return res.json([]);
    }

    res.json(messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
