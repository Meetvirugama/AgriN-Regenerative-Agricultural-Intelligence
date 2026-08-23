import React, { useState } from "react";
import { Mic, X } from "lucide-react";
import AIAssistant from "./AIAssistant"; 

export function VoiceAssistantFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 50,
          padding: "1rem",
          borderRadius: "9999px",
          backgroundColor: "#16a34a",
          color: "white",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          border: "none",
          cursor: "pointer"
        }}
        aria-label="Open Voice Assistant"
      >
        <Mic size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.5)"
        }}>
          <div style={{
            position: "relative",
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            maxWidth: "28rem",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "1rem"
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                color: "#6b7280",
                background: "transparent",
                border: "none",
                cursor: "pointer"
              }}
              aria-label="Close"
            >
              <X size={24} />
            </button>
            
            <div style={{ marginTop: "1rem" }}>
              <AIAssistant />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
