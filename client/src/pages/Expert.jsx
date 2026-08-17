import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Phone, 
  Calendar, 
  Paperclip, 
  Send,
  Star,
  Check,
  ChevronRight,
  Info,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Expert.css";

export const Expert = () => {
  const [experts, setExperts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const data = await cropApi.getExperts();
        setExperts(data);
      } catch (err) {
        console.error("Failed to fetch experts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExperts();
  }, []);
  return (
    <div className="expert-container">
      
      {/* HEADER */}
      <div className="expert-header">
        <h1 className="expert-title">Expert Support</h1>
        <p className="expert-subtitle">Get help from agricultural experts</p>
      </div>

      {/* TABS */}
      <div className="expert-tabs">
        <button className="expert-tab active">
          <MessageSquare size={16} /> Live Chat
        </button>
        <button className="expert-tab inactive">
          <Phone size={16} /> Call Expert
        </button>
        <button className="expert-tab inactive">
          <Calendar size={16} /> Schedule Consultation
        </button>
      </div>

      <div className="expert-content">
        
        {/* Main Content (Chat & Experts List) */}
        <div className="expert-main">
          
          {/* Active Chat Column */}
          <div className="expert-chat-card">
            {/* Chat Header */}
            <div className="expert-chat-header">
              <div className="expert-chat-profile">
                <div className="expert-avatar-wrapper">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Dr. Amit" className="expert-avatar" />
                  <div className="expert-status-dot"></div>
                </div>
                <div>
                  <div className="expert-chat-info-row">
                    <h3 className="expert-chat-name">Chat with Expert</h3>
                    <span className="expert-status-badge">Online</span>
                  </div>
                  <p className="expert-chat-meta">Typically replies in 2 mins</p>
                </div>
              </div>
              <button className="expert-chat-end-btn">
                End Chat <span className="expert-chat-end-icon">+</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="expert-chat-messages">
              
              {/* Expert Message */}
              <div className="expert-msg-row">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Dr. Amit" className="expert-msg-avatar" />
                <div className="expert-msg-bubble-wrapper">
                  <div className="expert-msg-bubble expert">
                    <span className="expert-msg-sender">Hello Ramesh! 👋</span>
                    I'm Dr. Amit Verma, your agricultural expert.<br/>
                    How can I help you today?
                  </div>
                  <span className="expert-msg-time">10:31 AM</span>
                </div>
              </div>

              {/* User Message */}
              <div className="expert-msg-row reverse">
                <div className="expert-msg-user-avatar">R</div>
                <div className="expert-msg-bubble-wrapper">
                  <div className="expert-msg-bubble user">
                    I have brown spots on wheat leaves.<br/>
                    What should I do?
                  </div>
                  <span className="expert-msg-time right">
                    10:32 AM <Check size={12} className="text-success" />
                  </span>
                </div>
              </div>

              {/* Expert Message */}
              <div className="expert-msg-row">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Dr. Amit" className="expert-msg-avatar" />
                <div className="expert-msg-bubble-wrapper">
                  <div className="expert-msg-bubble expert">
                    Thank you for sharing the image and details.<br/>
                    This looks like <strong>Brown Spot (Bipolaris sorokiniana)</strong>.<br/><br/>
                    I recommend applying Propiconazole 25% EC.<br/>
                    Would you like more detailed treatment steps?
                  </div>
                  <span className="expert-msg-time">10:33 AM</span>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="expert-chat-input-area">
              <div className="expert-chat-suggestions">
                <button className="expert-chat-suggestion-btn">Yes, show details</button>
                <button className="expert-chat-suggestion-btn">Share product options</button>
                <button className="expert-chat-suggestion-btn">Preventive measures</button>
                <button className="expert-chat-suggestion-btn">Thanks!</button>
              </div>
              <div className="expert-chat-input-box">
                <button className="expert-chat-attach-btn"><Paperclip size={18} /></button>
                <input type="text" placeholder="Type your message..." className="expert-chat-input" />
                <button className="expert-chat-send-btn">
                  <Send size={16} className="expert-chat-send-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Available Experts Column */}
          <div className="expert-list-card">
            <div className="expert-list-header">
              <h3 className="expert-list-title">Available Experts</h3>
              <button className="expert-list-view-all">View All</button>
            </div>

            <div className="expert-list">
              
              {isLoading ? (
                <div className="expert-list-loader">
                  <Loader2 className="expert-list-spinner" />
                </div>
              ) : experts.map((expert) => (
                <div key={expert.id} className="expert-item">
                  <div className="expert-item-info">
                    <img src={expert.imageUrl} alt="Expert" className="expert-item-avatar" />
                    <div>
                      <div className="expert-item-name-row">
                        <h4 className="expert-item-name">{expert.name}</h4>
                        {expert.status === 'Online' && (
                          <span className="expert-item-status">Online</span>
                        )}
                      </div>
                      <p className="expert-item-title">{expert.title}</p>
                      <div className="expert-item-rating">
                        <Star size={10} className="expert-item-star" /> {expert.rating} <span className="expert-item-reviews">({expert.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <button className="expert-item-chat-btn" onClick={() => navigate('/ask')}>Chat</button>
                </div>
              ))}

            </div>

            <button className="expert-list-footer-btn">
              View All Experts <ChevronRight size={16} />
            </button>
          </div>

        </div>

        {/* Right Sidebar Widgets */}
        <div className="expert-sidebar">
          
          {/* Schedule Consultation Card */}
          <div className="expert-widget">
            <div className="expert-widget-header">
              <Calendar size={20} className="text-success" />
              <h3 className="expert-chat-name">Schedule Consultation</h3>
            </div>
            <p className="expert-widget-desc">Book a 1-on-1 consultation</p>
            
            <div className="expert-widget-features">
              <div className="expert-widget-feature">
                <Check size={14} className="expert-widget-feature-icon" /> Detailed field discussion
              </div>
              <div className="expert-widget-feature">
                <Check size={14} className="expert-widget-feature-icon" /> Personalized solutions
              </div>
              <div className="expert-widget-feature">
                <Check size={14} className="expert-widget-feature-icon" /> Follow-up support
              </div>
            </div>

            <button className="expert-widget-primary-btn" onClick={() => navigate('/ask')}>
              Book Now <ChevronRight size={16} />
            </button>
          </div>

          {/* Call Expert Now Card */}
          <div className="expert-widget">
            <div className="expert-widget-header">
              <Phone size={20} className="text-success" />
              <h3 className="expert-chat-name">Call Expert Now</h3>
            </div>
            <p className="expert-widget-desc">Talk to expert instantly</p>
            
            <button className="expert-widget-call-btn">
              +91 1800 123 4567
            </button>
            <p className="expert-widget-time">Available: 9 AM - 6 PM</p>
          </div>

          {/* Top Help Topics */}
          <div className="expert-widget">
            <h3 className="expert-widget-topics-title">Top Help Topics</h3>
            
            <div className="expert-topics-list">
              <button className="expert-topic-btn">
                <span className="expert-topic-text">Disease Identification</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="expert-topic-btn">
                <span className="expert-topic-text text-success">Pest Management</span>
                <ChevronRight size={16} className="text-success" />
              </button>
              <button className="expert-topic-btn">
                <span className="expert-topic-text">Soil Health</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="expert-topic-btn">
                <span className="expert-topic-text">Fertilizer Recommendations</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="expert-topic-btn">
                <span className="expert-topic-text">Irrigation Management</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            </div>

            <button className="expert-topics-view-all">
              View All Topics <ChevronRight size={12} />
            </button>
          </div>

        </div>

      </div>

      {/* Bottom Area: History & Info Banner */}
      <div className="expert-bottom-area">
        
        {/* Support History Table */}
        <div className="expert-history-card">
          <div className="expert-history-header">
            <h3 className="expert-list-title">Your Support History</h3>
            <button className="expert-list-view-all">View All</button>
          </div>

          <div className="expert-history-table">
            <div className="expert-table-head">
              <div className="expert-th-date">Date & Time</div>
              <div className="expert-th-topic">Topic</div>
              <div className="expert-th-expert">Expert</div>
              <div className="expert-th-type">Type</div>
              <div className="expert-th-expert">Status</div>
            </div>

            <div className="expert-table-row">
              <div className="expert-td-date">17 Jun 2025, 04:15 PM</div>
              <div className="expert-td-topic">Rice yellow leaf problem</div>
              <div className="expert-td-expert">Dr. Neha Sharma</div>
              <div className="col-span-1"><span className="expert-td-type-badge">Chat</span></div>
              <div className="expert-td-status">
                <span className="expert-td-type-badge">Resolved</span>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info Banner */}
        <div className="expert-footer-banner">
          <Info size={18} className="expert-footer-icon" />
          <p className="expert-footer-text">Our experts provide guidance based on the information you share. Please consult local agricultural experts for final recommendations.</p>
        </div>

      </div>

    </div>
  );
};
