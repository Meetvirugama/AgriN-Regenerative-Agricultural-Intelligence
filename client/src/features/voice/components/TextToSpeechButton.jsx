import React, { useState } from "react";
import { voiceApi } from "../api/voiceApi";
import "./TextToSpeechButton.css";

export const TextToSpeechButton = ({ textToRead, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async (e) => {
    e.stopPropagation();
    if (isPlaying) {
      // In a real app, we'd keep track of the Audio object and stop it
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Synchronously unlock Web Speech API on user gesture for iOS/Safari
    if ("speechSynthesis" in window) {
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
      window.speechSynthesis.cancel();
    }

    setIsLoading(true);
    try {
      // First try our backend API
      const audioDataUrl = await voiceApi.tts(
        textToRead,
        localStorage.getItem("agri_lang") || "en-US",
      );
      
      setIsLoading(false);
      setIsPlaying(true);

      if (
        audioDataUrl &&
        audioDataUrl !== "data:audio/wav;base64,bW9jay1hdWRpby1kYXRh"
      ) {
        // Play returned audio
        const audio = new Audio(audioDataUrl);
        audio.onended = () => setIsPlaying(false);
        audio.play().catch((err) => {
          console.error("Audio playback failed", err);
          fallbackSpeech();
        });
      } else {
        // Fallback to native SpeechSynthesis if backend returns mock buffer
        fallbackSpeech();
      }
    } catch (err) {
      console.error("TTS API failed", err);
      setIsLoading(false);
      setIsPlaying(true);
      fallbackSpeech();
    }
  };

  const fallbackSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = localStorage.getItem("agri_lang") || "en-US";
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={`tts-button ${isPlaying ? "tts-button-playing" : "tts-button-idle"} ${className}`}
      aria-label="Read text aloud"
      disabled={isLoading}
    >
      {isLoading ? (
        <svg className="tts-icon tts-loading-icon" fill="none" viewBox="0 0 24 24">
          <circle
            className="tts-spinner-track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="tts-spinner-head"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <svg
          className="tts-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isPlaying ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          )}
        </svg>
      )}
    </button>
  );
};
