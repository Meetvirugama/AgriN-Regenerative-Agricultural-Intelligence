import React, { useCallback, useEffect, useRef, useState } from "react";
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
  ArrowUp,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";
import "./Ask.css";

const QUICK_PROMPTS = [
  {
    icon: Bug,
    text: "How should I manage aphids in my current crop?",
    category: "Pest Management",
  },
  {
    icon: Droplet,
    text: "Should I irrigate my field today?",
    category: "Irrigation",
  },
  {
    icon: Sprout,
    text: "What nutrient care does my crop need now?",
    category: "Nutrient Care",
  },
  {
    icon: CloudSun,
    text: "What weather risks should I prepare for this week?",
    category: "Climate Risk",
  },
];

const createClientId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeMessage = (message) => ({
  id: message.id || createClientId(),
  role: message.role === "user" ? "user" : "ai",
  content: message.content || "",
  timestamp: message.timestamp || new Date().toISOString(),
  advisory: message.advisory || null,
  sources: Array.isArray(message.sources) ? message.sources : [],
});

const severityConfig = {
  low: { label: "Low concern", icon: Info },
  medium: { label: "Attention", icon: AlertTriangle },
  high: { label: "High concern", icon: AlertTriangle },
  critical: { label: "Urgent", icon: AlertTriangle },
};

const AdvisoryCard = ({ advisory }) => {
  if (!advisory) return null;
  const severity = advisory.severity || "low";
  const config = severityConfig[severity] || severityConfig.low;
  const SeverityIcon = config.icon;

  return (
    <div className={`ask-advisory-card severity-${severity}`}>
      <div className="ask-advisory-header">
        <div className="ask-advisory-title">
          <SeverityIcon size={16} />
          <span>{config.label}</span>
        </div>
        {typeof advisory.confidence === "number" && (
          <span className="ask-confidence">
            {Math.round(advisory.confidence * 100)}% confidence
          </span>
        )}
      </div>

      {advisory.what && (
        <div className="ask-advisory-section">
          <strong>What is happening</strong>
          <p>{advisory.what}</p>
        </div>
      )}

      {advisory.why && (
        <div className="ask-advisory-section">
          <strong>Why</strong>
          <p>{advisory.why}</p>
        </div>
      )}

      {advisory.action && (
        <div className="ask-advisory-action">
          <CheckCircle2 size={16} />
          <div>
            <strong>Recommended action</strong>
            <p>{advisory.action}</p>
          </div>
        </div>
      )}

      {advisory.when && (
        <div className="ask-advisory-section">
          <strong>When</strong>
          <p>{advisory.when}</p>
        </div>
      )}

      {advisory.monitor && (
        <div className="ask-advisory-section">
          <strong>Monitor</strong>
          <p>{advisory.monitor}</p>
        </div>
      )}

      {advisory.escalate === true && (
        <div className="ask-escalation-warning">
          <AlertTriangle size={16} />
          <span>
            This case may require verification by an agricultural expert.
          </span>
        </div>
      )}
    </div>
  );
};

const SourceList = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="ask-source-list">
      <span className="ask-source-label">Data used</span>
      <div className="ask-source-items">
        {sources.map((source) => (
          <span
            className="ask-source-chip"
            key={`${source.type}-${source.timestamp || source.name}`}
          >
            {source.name || source.type}
            {source.timestamp && (
              <small>{formatTime(source.timestamp)}</small>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Ask = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [fieldContext, setFieldContext] = useState(null);
  const [error, setError] = useState(null);
  const [headerPortalEl, setHeaderPortalEl] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById("ask-header-portal");
    if (el) {
      setHeaderPortalEl(el);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    let mounted = true;
    const loadInitialState = async () => {
      setIsLoadingHistory(true);
      setError(null);
      try {
        const [context, history] = await Promise.all([
          cropApi.getAskContext(),
          cropApi.getChatHistory(),
        ]);
        if (!mounted) return;
        setFieldContext(context || null);
        const normalizedHistory = Array.isArray(history)
          ? history.map(normalizeMessage)
          : [];
        setMessages(normalizedHistory);
      } catch (err) {
        console.error("Failed to initialize Ask AgriMesh:", err);
        if (mounted) {
          setError(err?.message || "Unable to load your field intelligence profile.");
        }
      } finally {
        if (mounted) {
          setIsLoadingHistory(false);
        }
      }
    };
    loadInitialState();
    return () => {
      mounted = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (customPrompt) => {
      const text = typeof customPrompt === "string" ? customPrompt : input;
      const cleanedText = text.trim();
      if (!cleanedText || isTyping) {
        return;
      }

      setError(null);
      const clientMessageId = createClientId();
      const userMessage = {
        id: clientMessageId,
        role: "user",
        content: cleanedText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await cropApi.sendChatMessage({
          message: cleanedText,
          clientMessageId,
          signal: controller.signal,
        });

        if (!response) {
          throw new Error("Empty response from agronomy service.");
        }

        const aiMessage = normalizeMessage({
          id: response.id,
          role: "ai",
          content: response.content,
          timestamp: response.timestamp,
          advisory: response.advisory,
          sources: response.sources,
        });

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }
        console.error("AgriMesh advisory error:", err);
        setError(err?.message || "The agronomy service could not process your request.");
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsTyping(false);
      }
    },
    [input, isTyping]
  );

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (event) => {
    const value = event.target.value;
    setInput(value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
  };

  const handleClearChat = async () => {
    if (isTyping) return;
    try {
      setError(null);
      await cropApi.clearChatHistory();
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
      setError(err?.message || "Unable to start a new conversation.");
    }
  };

  const desktopHeaderContent = (
    <div className="intelligence-unified-nav-bar">
      <div className="intelligence-unified-left">
        <div className="intelligence-title-row">
          <h1 className="intelligence-main-title">Ask AgriMesh</h1>
          <span className="intelligence-ai-pill">
            <Sparkles size={12} /> AI Agronomist
          </span>
        </div>
        {fieldContext?.field && (
          <div className="ask-field-context">
            <span>{fieldContext.field.name || "Current Field"}</span>
            {fieldContext.crop?.name && (
              <>
                <span>•</span>
                <span>{fieldContext.crop.name}</span>
              </>
            )}
            {fieldContext.crop?.growthStage && (
              <>
                <span>•</span>
                <span>{fieldContext.crop.growthStage}</span>
              </>
            )}
          </div>
        )}
      </div>
      {messages.length > 0 && (
        <button
          onClick={handleClearChat}
          className="ask-new-chat-btn"
          type="button"
          disabled={isTyping}
        >
          <RotateCcw size={13} />
          <span>New Chat</span>
        </button>
      )}
    </div>
  );

  if (isLoadingHistory) {
    return (
      <div className="ask-minimal-viewport ask-loading-screen">
        <Loader2 size={26} className="animate-spin" />
        <p>Loading your field intelligence...</p>
      </div>
    );
  }

  return (
    <div className="ask-minimal-viewport">
      {headerPortalEl && createPortal(desktopHeaderContent, headerPortalEl)}
      
      <div className="ask-page-header-mobile">
        <div className="intelligence-mobile-title-block">
          <div className="intelligence-title-row">
            <h1 className="intelligence-main-title">Ask AgriMesh</h1>
            <span className="intelligence-ai-pill">
              <Sparkles size={12} /> AI Agronomist
            </span>
          </div>
          <p className="intelligence-mobile-subtitle">
            Field-specific agricultural intelligence based on your crop, weather,
            soil and field history.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="ask-new-chat-btn mobile"
            type="button"
            disabled={isTyping}
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {error && (
        <div className="ask-error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      <main className="ask-chat-canvas">
        {messages.length === 0 ? (
          <div className="ask-empty-hero">
            <div className="ask-hero-badge">
              <Sprout size={32} strokeWidth={2.2} />
            </div>
            <h2 className="ask-hero-heading">How can I help your farm today?</h2>
            <p className="ask-hero-description">
              Ask about your crop, irrigation, pests, nutrients, weather risk or
              field health. AgriMesh reasons over your registered field data
              instead of giving generic farming advice.
            </p>
            <div className="ask-prompts-grid">
              {QUICK_PROMPTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.text}
                    onClick={() => handleSend(item.text)}
                    className="ask-prompt-card"
                    type="button"
                    disabled={isTyping}
                  >
                    <div className="ask-prompt-top">
                      <span className="ask-prompt-icon">
                        <Icon size={16} />
                      </span>
                      <span className="ask-prompt-category">
                        {item.category}
                      </span>
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
                className={`ask-message-row ${
                  msg.role === "user" ? "user-row" : "ai-row"
                }`}
              >
                <div
                  className={`ask-avatar-circle ${
                    msg.role === "user" ? "user" : "ai"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={15} />
                  ) : (
                    <Leaf size={15} />
                  )}
                </div>
                <div className="ask-bubble-container">
                  <div
                    className={`ask-bubble ${
                      msg.role === "user" ? "user-bubble" : "ai-bubble"
                    }`}
                  >
                    <p className="ask-bubble-text">{msg.content}</p>
                  </div>
                  {msg.role === "ai" && (
                    <>
                      <AdvisoryCard advisory={msg.advisory} />
                      <SourceList sources={msg.sources} />
                    </>
                  )}
                  <span className="ask-timestamp">
                    {formatTime(msg.timestamp)}
                  </span>
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
                    <Loader2 size={15} className="animate-spin" />
                    <span>Analyzing your field conditions...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="ask-dock-footer">
        <div className="ask-dock-box">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your field..."
            className="ask-dock-textarea"
            disabled={isTyping}
            maxLength={2000}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`ask-dock-send-btn ${input.trim() ? "active" : ""}`}
            type="button"
            aria-label="Send message"
          >
            {isTyping ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowUp size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="ask-dock-hint">
          AgriMesh uses your field context to provide localized agronomic
          guidance. AI recommendations should be verified for high-risk
          treatment decisions.
        </p>
      </footer>
    </div>
  );
};
