import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Leaf, 
  Bug, 
  CloudSun, 
  Droplet, 
  Sparkles,
  Loader2,
  User,
  RotateCcw,
  Sprout,
  ArrowUp
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Ask.css";

const QUICK_PROMPTS = [
  {
    icon: Bug,
    text: "How to control aphids in moong?",
    category: "Pest Management"
  },
  {
    icon: Droplet,
    text: "When should I irrigate wheat?",
    category: "Irrigation Schedule"
  },
  {
    icon: Sprout,
    text: "Best fertilizer schedule for rice crop",
    category: "Nutrient Care"
  },
  {
    icon: CloudSun,
    text: "Weather updates and advisory for this week",
    category: "Climate & Risk"
  }
];

export const Ask = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [headerPortalEl, setHeaderPortalEl] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById("ask-header-portal");
    if (el) setHeaderPortalEl(el);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customPrompt) => {
    const textToSend = typeof customPrompt === "string" ? customPrompt : input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const aiResponse = await cropApi.sendChatMessage(userMessage.content);
      setMessages((prev) => [
        ...prev,
        {
          id: aiResponse.id || `ai-${Date.now()}`,
          role: "ai",
          content: aiResponse.content,
          timestamp: new Date(aiResponse.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "Sorry, I am having trouble connecting to the agronomy engine. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
  };

  const desktopHeaderContent = (
    <div className="intelligence-unified-nav-bar">
      <div className="intelligence-unified-left">
        <div className="intelligence-title-row">
          <h1 className="intelligence-main-title">Ask AgriMesh</h1>
          <span className="intelligence-ai-pill">
            <Sparkles size={12} className="text-emerald-500" />
            AI Agronomist
          </span>
        </div>
      </div>

      {messages.length > 0 && (
        <button 
          onClick={handleClearChat}
          className="ask-new-chat-btn"
          type="button"
          title="Start new conversation"
        >
          <RotateCcw size={13} />
          <span>New Chat</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="ask-minimal-viewport">
      {headerPortalEl && createPortal(desktopHeaderContent, headerPortalEl)}

      {/* MOBILE IN-PAGE HEADER (Visible on Mobile only, identical to Intelligence page) */}
      <div className="ask-page-header-mobile">
        <div className="intelligence-mobile-title-block">
          <div className="intelligence-title-row">
            <h1 className="intelligence-main-title">Ask AgriMesh</h1>
            <span className="intelligence-ai-pill">
              <Sparkles size={12} className="text-emerald-500" />
              AI Agronomist
            </span>
          </div>
          <p className="intelligence-mobile-subtitle">Instant expert guidance on crop health, soil & field management</p>
        </div>

        {messages.length > 0 && (
          <button 
            onClick={handleClearChat}
            className="ask-new-chat-btn mobile"
            type="button"
            title="Start new conversation"
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* ─── 2. MAIN CONVERSATION CANVAS ─── */}
      <main className="ask-chat-canvas">
        {messages.length === 0 ? (
          <div className="ask-empty-hero">
            <div className="ask-hero-badge">
              <Sprout size={32} strokeWidth={2.2} />
            </div>
            <h2 className="ask-hero-heading">How can I help your farm today?</h2>
            <p className="ask-hero-description">
              Ask anything about pest diagnosis, fertilizer dosages, optimal irrigation schedules, or weather precautions.
            </p>

            {/* Quick Prompt Cards */}
            <div className="ask-prompts-grid">
              {QUICK_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.text)}
                    className="ask-prompt-card"
                    type="button"
                  >
                    <div className="ask-prompt-top">
                      <span className="ask-prompt-icon">
                        <Icon size={16} />
                      </span>
                      <span className="ask-prompt-category">{item.category}</span>
                    </div>
                    <span className="ask-prompt-query">{item.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="ask-thread-stream">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ask-message-row ${msg.role === "user" ? "user-row" : "ai-row"}`}
              >
                <div className={`ask-avatar-circle ${msg.role === "user" ? "user" : "ai"}`}>
                  {msg.role === "user" ? <User size={15} /> : <Leaf size={15} />}
                </div>
                <div className="ask-bubble-container">
                  <div className={`ask-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`}>
                    <p className="ask-bubble-text">{msg.content}</p>
                  </div>
                  <span className="ask-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ask-message-row ai-row">
                <div className="ask-avatar-circle ai">
                  <Leaf size={15} />
                </div>
                <div className="ask-bubble-container">
                  <div className="ask-bubble ai-bubble typing-bubble">
                    <Loader2 size={15} className="animate-spin text-emerald-600" />
                    <span>Analyzing field data & preparing recommendation...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ─── 3. MINIMALIST FLOATING INPUT DOCK ─── */}
      <footer className="ask-dock-footer">
        <div className="ask-dock-box">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your farm (e.g. How to treat yellow rust on wheat?)..."
            className="ask-dock-textarea"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`ask-dock-send-btn ${input.trim() ? "active" : ""}`}
            type="button"
            aria-label="Send message"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
        <p className="ask-dock-hint">
          AgriMesh AI offers localized agronomic advice. Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.
        </p>
      </footer>
    </div>
  );
};
