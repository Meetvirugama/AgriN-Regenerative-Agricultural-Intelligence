import { request } from '../../../services/apiClient';

export const voiceApi = {
  setLanguage: async (language: string): Promise<void> => {
    try {
      await request('user/language', {
        method: 'PUT',
        body: JSON.stringify({ language })
      });
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  },

  stt: async (audioBlob: Blob, language: string): Promise<string> => {
    try {
      const data = await request<{text: string}>('voice/stt', {
        method: 'POST',
        body: JSON.stringify({ language })
      });
      return data.text;
    } catch (error) {
      console.error('STT Failed:', error);
      return "I couldn't understand that, could you repeat?";
    }
  },

  tts: async (text: string, language: string): Promise<string | null> => {
    try {
      const data = await request<{audioContent: string}>('voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text, language })
      });
      return `data:audio/wav;base64,${data.audioContent}`;
    } catch (error) {
      console.error('TTS Failed:', error);
      return null;
    }
  }
};
