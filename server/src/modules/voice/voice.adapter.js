import { PythonClient } from "../../services/pythonClient.js";

export class PythonVoiceAdapter {
  async transcribe(audioBuffer, languageCode) {
    console.log(
      `[VoiceAdapter] Delegating STT to Python service for language ${languageCode}`,
    );
    const result = await PythonClient.transcribeAudio(
      audioBuffer,
      languageCode,
    );
    return result.text;
  }

  async synthesize(text, languageCode) {
    console.log(
      `[VoiceAdapter] Delegating TTS to Python service for language ${languageCode}`,
    );
    const result = await PythonClient.synthesizeSpeech(text, languageCode);
    // The Python service returns base64 encoded string, we convert back to Buffer
    return Buffer.from(result.audioContent, "base64");
  }

  async chat(sessionId, message) {
    console.log(
      `[VoiceAdapter] Delegating Chat to Python service for session ${sessionId}`,
    );
    const result = await PythonClient.chatAgent(sessionId, message);
    return result;
  }
}
