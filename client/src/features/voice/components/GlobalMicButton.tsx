import React, { useState } from 'react';
import { voiceApi } from '../api/voiceApi';

export const GlobalMicButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  // Mock audio recording functionality since `MediaRecorder` requires HTTPS and permissions
  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);

      // Simulate a small delay for recording stop
      await new Promise(r => setTimeout(r, 500));
      
      const text = await voiceApi.stt(new Blob(), localStorage.getItem('agri_lang') || 'en-US');
      
      setIsProcessing(false);
      setResponse(text);

      // Auto-play response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = localStorage.getItem('agri_lang') || 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      
      // Clear after 5 seconds
      setTimeout(() => setResponse(null), 5000);
    } else {
      // Synchronously unlock Web Speech API on user gesture for iOS/Safari
      if ('speechSynthesis' in window) {
        const unlockUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(unlockUtterance);
        window.speechSynthesis.cancel();
      }
      setIsRecording(true);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
        
        {/* Processing State or Response Text */}
        {(isProcessing || response) && (
          <div className="bg-surface border-2 border-primary p-4 rounded-2xl shadow-xl max-w-xs animate-fade-in-up">
            {isProcessing ? (
              <div className="flex items-center gap-3 text-primary font-bold">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Thinking...
              </div>
            ) : (
              <p className="text-text font-medium leading-tight">{response}</p>
            )}
          </div>
        )}

        <button
          onClick={handleToggleRecord}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? 'bg-error text-white scale-110 animate-pulse-ring' 
              : 'bg-primary text-white hover:scale-105'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Ask a question aloud'}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isRecording ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>
      </div>
    </>
  );
};
