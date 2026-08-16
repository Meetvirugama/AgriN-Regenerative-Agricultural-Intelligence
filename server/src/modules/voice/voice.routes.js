import { Router } from "express";
import { PythonVoiceAdapter } from "./VoiceAdapter.js";

const router = Router();
const voiceAdapter = new PythonVoiceAdapter();

// Mock language preference storage (in memory for MVP)
let userLanguage = "en-US";

// Endpoint to change language preference (Layer 01 update)
router.put("/user/language", (req, res) => {
  const { language } = req.body;
  if (language) {
    userLanguage = language;
    console.log(`User preferred language updated to: ${userLanguage}`);
    res.json({ success: true, language: userLanguage });
  } else {
    res.status(400).json({ error: "Language is required" });
  }
});

// Endpoint for Speech-to-Text (STT)
router.post("/voice/stt", async (req, res) => {
  try {
    // In a real app, use multer to parse the audio file from req.body or req.file
    // For MVP, we mock the buffer and use the stored preferred language
    const mockAudioBuffer = Buffer.from("dummy-audio");
    const transcribedText = await voiceAdapter.transcribe(
      mockAudioBuffer,
      userLanguage,
    );
    res.json({ text: transcribedText, language: userLanguage });
  } catch (error) {
    console.error("STT Error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

// Endpoint for Text-to-Speech (TTS)
router.post("/voice/tts", async (req, res) => {
  try {
    const { text, language } = req.body;
    const targetLanguage = language || userLanguage;
    const audioBuffer = await voiceAdapter.synthesize(text, targetLanguage);
    // Return base64 encoded audio for easy frontend consumption in MVP
    const base64Audio = audioBuffer.toString("base64");
    res.json({ audioContent: base64Audio, format: "audio/wav" });
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

export default router;
