import { API_BASE } from '../../../lib/apiClient';

export const voiceApi = {
  setLanguage: async (language: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/user/language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  },

  stt: async (audioBlob: Blob, language: string): Promise<string> => {
    try {
      // For MVP, we send a dummy payload as FormData would require multer on backend
      const response = await fetch(`${API_BASE}/voice/stt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('STT Failed:', error);
      return "I couldn't understand that, could you repeat?";
    }
  },

  tts: async (text: string, language: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });
      const data = await response.json();
      return `data:audio/wav;base64,${data.audioContent}`;
    } catch (error) {
      console.error('TTS Failed:', error);
      return null;
    }
  }
};
