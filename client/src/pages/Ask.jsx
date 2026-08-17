import React, { useState, useEffect, useRef } from "react";
import { 
  Leaf, 
  Bug, 
  CloudSun, 
  BarChart2, 
  Tag, 
  Paperclip, 
  Send,
  Zap,
  Search,
  Sprout,
  Droplet,
  Calculator,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Loader2,
  User
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Ask.css";

// Custom Bag icon for Fertilizer
const FertilizerBag = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 3h10v18H7z"></path>
    <path d="M10 8h4"></path>
    <path d="M12 11v4"></path>
    <path d="M10 13h4"></path>
  </svg>
);

export const Ask = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await cropApi.getRecentChats();
        setRecentChats(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecent();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const aiResponse = await cropApi.sendChatMessage(userMessage.content);
      setMessages((prev) => [...prev, {
        id: aiResponse.id,
        role: "ai",
        content: aiResponse.content,
        timestamp: new Date(aiResponse.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "ai",
        content: "Sorry, I am having trouble connecting to the server. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
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

  return (
    <div className="ask-container">
      
      {/* HEADER */}
      <div className="ask-header">
        <h1 className="ask-title">Ask AgriMesh</h1>
        <p className="ask-subtitle">Your AI farming assistant for expert advice and insights</p>
      </div>

      <div className="ask-content">
        
        {/* Left Column (Main Chat UI) */}
        <div className="ask-main">
          
          <div className="ask-chat-area">
            {messages.length === 0 ? (
              <>
                {/* Greeting */}
                <div className="ask-greeting">
                  <div className="ask-greeting-icon-wrapper">
                    <Leaf size={32} />
                    <Sparkles size={16} className="ask-greeting-sparkle" />
                  </div>
                  <h2 className="ask-greeting-title">Hello Ramesh! <span>👋</span></h2>
                  <p className="ask-greeting-subtitle">How can I help you today?</p>
                </div>

                {/* Topics Grid (6 cards) */}
                <div className="ask-topics-grid">
                  
                  <div onClick={() => setInput("How should I manage my crops this season?")} className="ask-topic-card success">
                    <div className="ask-topic-content">
                      <div className="ask-topic-icon success">
                        <Leaf size={20} />
                      </div>
                      <div className="ask-topic-text-group">
                        <h3 className="ask-topic-title">Crop Management</h3>
                        <p className="ask-topic-desc">Get advice on crop care, irrigation, and best practices.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="ask-topic-arrow" />
                  </div>

                  <div onClick={() => setInput("How to control aphids in moong?")} className="ask-topic-card warning">
                    <div className="ask-topic-content">
                      <div className="ask-topic-icon warning">
                        <Bug size={20} />
                      </div>
                      <div className="ask-topic-text-group">
                        <h3 className="ask-topic-title">Pest & Disease</h3>
                        <p className="ask-topic-desc">Identify and manage pests and diseases.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="ask-topic-arrow" />
                  </div>

                  <div onClick={() => setInput("Best fertilizer for rice crop")} className="ask-topic-card success">
                    <div className="ask-topic-content">
                      <div className="ask-topic-icon success">
                        <FertilizerBag size={20} />
                      </div>
                      <div className="ask-topic-text-group">
                        <h3 className="ask-topic-title">Fertilizer Guide</h3>
                        <p className="ask-topic-desc">Find the right fertilizers and application timing.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="ask-topic-arrow" />
                  </div>

                  <div onClick={() => setInput("Weather updates for this week")} className="ask-topic-card success">
                    <div className="ask-topic-content">
                      <div className="ask-topic-icon success">
                        <CloudSun size={20} />
                      </div>
                      <div className="ask-topic-text-group">
                        <h3 className="ask-topic-title">Weather & Alerts</h3>
                        <p className="ask-topic-desc">Check weather updates and agri advisories.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="ask-topic-arrow" />
                  </div>

                  <div onClick={() => setInput("What are the insights for my field?")} className="ask-topic-card success">
                    <div className="ask-topic-content">
                      <div className="ask-topic-icon success">
                        <BarChart2 size={20} />
                      </div>
                      <div className="ask-topic-text-group">
                        <h3 className="ask-topic-title">Field Insights</h3>
                        <p className="ask-topic-desc">Get AI insights about your fields.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="ask-topic-arrow" />
                  </div>

                  <div onClick={() => setInput("Latest market prices for wheat")} className="ask-topic-card success">
                    <div className="ask-topic-content">
                      <div className="ask-topic-icon success">
                        <Tag size={20} />
                      </div>
                      <div className="ask-topic-text-group">
                        <h3 className="ask-topic-title">Market Prices</h3>
                        <p className="ask-topic-desc">Check latest market prices for your crops.</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="ask-topic-arrow" />
                  </div>

                </div>

                {/* Suggestions */}
                <div className="ask-suggestions">
                  <p className="ask-suggestions-title">Try asking something like:</p>
                  <div className="ask-suggestions-list">
                    <button onClick={() => setInput("How to control aphids in moong?")} className="ask-suggestion-btn">
                      How to control aphids in moong?
                    </button>
                    <button onClick={() => setInput("When should I irrigate wheat?")} className="ask-suggestion-btn">
                      When should I irrigate wheat?
                    </button>
                    <button onClick={() => setInput("Best fertilizer for rice crop")} className="ask-suggestion-btn">
                      Best fertilizer for rice crop
                    </button>
                    <button onClick={() => setInput("Weather forecast for next 5 days")} className="ask-suggestion-btn">
                      Weather forecast for next 5 days
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="ask-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`ask-message-row ${msg.role === 'user' ? 'reverse' : ''}`}>
                    <div className={`ask-message-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Leaf size={16} />}
                    </div>
                    <div className={`ask-message-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                      {msg.content}
                      <span className={`ask-message-time ${msg.role === 'user' ? 'right' : ''}`}>{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="ask-typing-row">
                    <div className="ask-typing-avatar">
                      <Leaf size={16} />
                    </div>
                    <div className="ask-typing-bubble">
                      <Loader2 size={16} className="ask-typing-spinner" />
                      <span className="ask-typing-text">AgriMesh AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="ask-input-area">
            <div className="ask-input-box">
              <textarea 
                placeholder="Type your question here..." 
                className="ask-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <div className="ask-input-actions">
                <button className="ask-attach-btn">
                  <Paperclip size={20} />
                </button>
                <div className="ask-send-group">
                  <span className="ask-char-count">{input.length}/1000</span>
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="ask-send-btn"
                  >
                    <Send size={18} className="ask-send-icon" />
                  </button>
                </div>
              </div>
            </div>
            <p className="ask-disclaimer">
              AgriMesh AI provides general guidance. Please consult local experts for specific recommendations.
            </p>
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="ask-sidebar">
          
          {/* Quick Actions */}
          <div className="ask-widget">
            <div className="ask-widget-header">
              <Zap size={18} className="ask-widget-icon" />
              <h3 className="ask-widget-title">Quick Actions</h3>
            </div>
            <div className="ask-actions-list">
              <button className="ask-action-btn">
                <div className="ask-action-content">
                  <div className="ask-action-icon success">
                    <Search size={16} />
                  </div>
                  <span className="ask-action-text">Diagnose Crop Problem</span>
                </div>
                <ChevronRight size={16} className="ask-action-chevron" />
              </button>
              
              <button className="ask-action-btn">
                <div className="ask-action-content">
                  <div className="ask-action-icon secondary">
                    <Sprout size={16} />
                  </div>
                  <span className="ask-action-text">Soil Health Check</span>
                </div>
                <ChevronRight size={16} className="ask-action-chevron" />
              </button>
              
              <button className="ask-action-btn">
                <div className="ask-action-content">
                  <div className="ask-action-icon info">
                    <Droplet size={16} />
                  </div>
                  <span className="ask-action-text">Irrigation Scheduler</span>
                </div>
                <ChevronRight size={16} className="ask-action-chevron" />
              </button>
              
              <button className="ask-action-btn">
                <div className="ask-action-content">
                  <div className="ask-action-icon secondary">
                    <Calculator size={16} />
                  </div>
                  <span className="ask-action-text">Profitability Calculator</span>
                </div>
                <ChevronRight size={16} className="ask-action-chevron" />
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="ask-widget">
            <div className="ask-recent-header">
              <div className="ask-recent-title-group">
                <MessageSquare size={18} className="ask-recent-icon" />
                <h3 className="ask-recent-title">Recent Conversations</h3>
              </div>
              <button className="ask-recent-view-all">View All</button>
            </div>
            
            <div className="ask-recent-list">
              {recentChats.map((chat) => (
                <div key={chat.id} className="ask-recent-item">
                  <div className="ask-recent-content">
                    <h4 className="ask-recent-item-title">{chat.title}</h4>
                    <p className="ask-recent-item-desc">{chat.snippet}</p>
                  </div>
                  <div className="ask-recent-meta">
                    <span className="ask-recent-time">{chat.time}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
