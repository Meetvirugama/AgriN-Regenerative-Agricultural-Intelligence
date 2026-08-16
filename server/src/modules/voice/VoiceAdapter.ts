import { PythonClient } from '../../services/pythonClient';

export interface STTProvider {
  transcribe(audioBuffer: Buffer, languageCode: string): Promise<string>;
}

export interface TTSProvider {
  synthesize(text: string, languageCode: string): Promise<Buffer>;
}

export class PythonVoiceAdapter implements STTProvider, TTSProvider {
  async transcribe(audioBuffer: Buffer, languageCode: string): Promise<string> {
    console.log(`[VoiceAdapter] Delegating STT to Python service for language ${languageCode}`);
    const result = await PythonClient.transcribeAudio(audioBuffer, languageCode);
    return result.text;
  }

  async synthesize(text: string, languageCode: string): Promise<Buffer> {
    console.log(`[VoiceAdapter] Delegating TTS to Python service for language ${languageCode}`);
    const result = await PythonClient.synthesizeSpeech(text, languageCode);
    // The Python service returns base64 encoded string, we convert back to Buffer
    return Buffer.from(result.audioContent, 'base64');
  }
}
