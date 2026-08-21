import { request } from "../../../services/apiClient";

export const voiceApi = {
  setLanguage: async (language) => {
    try {
      await request("user/language", {
        method: "PUT",
        body: JSON.stringify({ language }),
      });
    } catch (error) {
      console.error("Failed to set language:", error);
    }
  },

  stt: async (audioBlob, language) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      if (language) formData.append("language", language);

      const data = await request("voice/stt", {
        method: "POST",
        body: formData,
      });
      return data.text;
    } catch (error) {
      console.error("STT Failed:", error);
      return "I couldn't understand that, could you repeat?";
    }
  },

  tts: async (text, language) => {
    try {
      const data = await request("voice/tts", {
        method: "POST",
        body: JSON.stringify({ text, language }),
      });
      return `data:audio/wav;base64,${data.audioContent}`;
    } catch (error) {
      console.error("TTS Failed:", error);
      return null;
    }
  },
};
