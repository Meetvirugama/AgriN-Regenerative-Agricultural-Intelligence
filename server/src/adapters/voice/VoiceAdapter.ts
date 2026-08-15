export interface STTProvider {
  transcribe(audioBuffer: Buffer, languageCode: string): Promise<string>;
}

export interface TTSProvider {
  synthesize(text: string, languageCode: string): Promise<Buffer>;
}

export class MockVoiceAdapter implements STTProvider, TTSProvider {
  async transcribe(audioBuffer: Buffer, languageCode: string): Promise<string> {
    console.log(`[Mock STT] Transcribing audio buffer of length ${audioBuffer.length} with language ${languageCode}`);
    // Mock response parsing agricultural terms
    return "What should I do about the heat stress on my wheat?";
  }

  async synthesize(text: string, languageCode: string): Promise<Buffer> {
    console.log(`[Mock TTS] Synthesizing text: "${text.substring(0, 30)}..." in language ${languageCode}`);
    // Return a dummy audio buffer (could be an empty wav file)
    // For MVP, we will rely on client-side native SpeechSynthesis API as the fallback anyway
    return Buffer.from("mock-audio-data");
  }
}
