import React, { useState } from "react";
import { Mic, X } from "lucide-react";
import AIAssistant from "./AIAssistant"; 
import "./VoiceAssistantFAB.css";

export function VoiceAssistantFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="voice-fab"
        aria-label="Open Voice Assistant"
      >
        <Mic size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="voice-modal-overlay">
          <div className="voice-modal-content">
            <button
              onClick={() => setIsOpen(false)}
              className="voice-modal-close"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            
            <div className="voice-modal-inner">
              <AIAssistant />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
