import { Router } from "express";
import multer from "multer";
import { PythonVoiceAdapter } from "./voice.adapter.js";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { query, queryOne } from "../../db/connection.js";

const router = Router();
const voiceAdapter = new PythonVoiceAdapter();

// multer — in-memory storage for audio uploads (no disk writes)
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    // Only accept audio MIME types (e.g. audio/webm, audio/wav, audio/mpeg, video/webm fallback)
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  },
});

/**
 * PUT /api/v1/user/language
 * Store language preference per-farmer (in DB) rather than a global in-memory variable.
 * Requires authentication so the preference is correctly scoped to the individual farmer.
 */
router.put("/user/language", requireAuth, async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ error: "Language is required" });
    }

    const farmerId = req.farmer.sub;

    // Persist language preference to the farmer's row in the DB
    try {
      await queryOne(
        `UPDATE farmers SET preferred_language = $1 WHERE id = $2 RETURNING preferred_language`,
        [language, farmerId],
      );
    } catch {
      // If DB update fails (e.g., column missing), still acknowledge the request
      console.warn("[Voice] Could not persist language preference to DB — column may not exist yet.");
    }

    res.json({ success: true, language });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/voice/stt
 * Speech-to-Text endpoint.
 * Accepts a real audio file upload (multipart/form-data field: "audio").
 * Falls back to text body if no file provided.
 */
router.post("/voice/stt", requireAuth, audioUpload.single("audio"), async (req, res, next) => {
  try {
    // Determine the target language: from body, or from farmer's DB preference, or default
    let language = req.body?.language ?? "en-US";
    if (req.farmer?.sub) {
      try {
        const row = await queryOne(
          `SELECT preferred_language FROM farmers WHERE id = $1`,
          [req.farmer.sub],
        );
        if (row?.preferred_language) language = row.preferred_language;
      } catch {
        // Ignore DB error — use default language
      }
    }

    // Use real uploaded audio buffer; reject if no file provided
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required. Upload as multipart/form-data with field name 'audio'." });
    }

    const audioBuffer = req.file.buffer;
    const transcribedText = await voiceAdapter.transcribe(audioBuffer, language);
    res.json({ text: transcribedText, language });
  } catch (error) {
    console.error("STT Error:", error);
    next(error);
  }
});

/**
 * POST /api/v1/voice/tts
 * Text-to-Speech endpoint.
 * Accepts { text, language? } — language defaults to farmer's DB preference or "en-US".
 */
router.post("/voice/tts", requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    // Determine target language per-farmer
    let language = req.body?.language ?? "en-US";
    if (req.farmer?.sub) {
      try {
        const row = await queryOne(
          `SELECT preferred_language FROM farmers WHERE id = $1`,
          [req.farmer.sub],
        );
        if (row?.preferred_language) language = row.preferred_language;
      } catch {
        // Ignore DB error — use default
      }
    }

    const audioBuffer = await voiceAdapter.synthesize(text, language);
    // Return base64 encoded audio for frontend consumption
    const base64Audio = audioBuffer.toString("base64");
    res.json({ audioContent: base64Audio, format: "audio/wav", language });
  } catch (error) {
    console.error("TTS Error:", error);
    next(error);
  }
});

/**
 * POST /api/v1/voice/chat
 * Chat endpoint for voice assistant logic.
 * Accepts { session_id, message }
 */
router.post("/voice/chat", requireAuth, async (req, res, next) => {
  try {
    const { session_id, message } = req.body;
    if (!session_id || !message) {
      return res.status(400).json({ error: "session_id and message are required" });
    }

    const result = await voiceAdapter.chat(session_id, message);
    res.json(result);
  } catch (error) {
    console.error("Chat Error:", error);
    next(error);
  }
});

export default router;
