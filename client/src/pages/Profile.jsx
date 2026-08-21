import React from "react";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Sprout, 
  Globe, 
  Map, 
  Maximize, 
  Clock,
  MessageSquare,
  Bell,
  ListTodo,
  ChevronDown,
  Crown,
  Check,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Settings,
  Info,
  Camera
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import "./Profile.css";

export const Profile = () => {
  const { farmer } = useAuth();
  return (
    <div className="profile-container">
      
      {/* HEADER */}
      <div>
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your account and preferences</p>
      </div>

      <div className="profile-layout">
        
        {/* Main Content (Left) */}
        <div className="profile-main-content">
          
          {/* Profile Details Card */}
          <div className="profile-card">
            
            {/* Identity Column */}
            <div className="profile-identity-section">
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  <User size={64} strokeWidth={1.5} />
                </div>
                <button className="profile-camera-btn">
                  <Camera size={18} />
                </button>
              </div>
              
              <div className="profile-name-group">
                <h2 className="profile-name">{farmer?.name || "Farmer"}</h2>
                <span className="profile-badge">Farmer</span>
              </div>
              
              <div className="profile-contact-list">
                <div className="profile-contact-item">
                  <Mail size={16} className="shrink-0" />
                  <span className="truncate">{farmer?.email || "farmer@example.com"}</span>
                </div>
                <div className="profile-contact-item">
                  <Phone size={16} className="shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="profile-contact-item">
                  <MapPin size={16} className="shrink-0" />
                  <span className="truncate">Madhopur, Uttar Pradesh, India</span>
                </div>
                <div className="profile-contact-item">
                  <Calendar size={16} className="shrink-0" />
                  <span>Member since 12 Nov 2024</span>
                </div>
              </div>

              <button className="profile-edit-btn">
                <Edit3 size={16} /> Edit Profile
              </button>
            </div>

            {/* About Me Column */}
            <div className="profile-about-section">
              <h3 className="profile-section-title">About Me</h3>
              
              <div className="profile-about-list">
                <div className="profile-about-item">
                  <div className="profile-about-label">
                    <Sprout size={18} className="text-success" /> Farming Experience
                  </div>
                  <span className="profile-about-value">8+ years</span>
                </div>
                
                <div className="profile-about-item">
                  <div className="profile-about-label">
                    <Globe size={18} className="text-success" /> Preferred Language
                  </div>
                  <span className="profile-about-value">English</span>
                </div>
                
                <div className="profile-about-item">
                  <div className="profile-about-label">
                    <Leaf size={18} className="text-success" /> Primary Crops
                  </div>
                  <span className="profile-about-value right">Wheat, Rice, Moong</span>
                </div>
                
                <div className="profile-about-item">
                  <div className="profile-about-label">
                    <Map size={18} className="text-success" /> Total Fields
                  </div>
                  <span className="profile-about-value">3</span>
                </div>
                
                <div className="profile-about-item">
                  <div className="profile-about-label">
                    <Maximize size={18} className="text-success" /> Total Area
                  </div>
                  <span className="profile-about-value">12.45 acres</span>
                </div>
                
                <div className="profile-about-item">
                  <div className="profile-about-label">
                    <Clock size={18} className="text-success" /> Time Zone
                  </div>
                  <span className="profile-about-value">Asia/Kolkata (IST)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Subscription Plan Card */}
          <div className="profile-plan-card">
            <div className="profile-plan-info">
              <div className="profile-plan-icon">
                <Crown size={32} />
              </div>
              <div>
                <p className="profile-plan-label">Subscription Plan</p>
                <h3 className="profile-plan-title">AgriMesh Free Plan</h3>
                <p className="profile-plan-desc">You are using the free plan with limited features.</p>
                <button className="profile-plan-link-btn">
                  View Plan Details <ChevronRight size={12} />
                </button>
              </div>
            </div>

            <div className="profile-plan-actions">
              <div className="profile-plan-features">
                <div className="profile-plan-feature-item">
                  <Check size={16} className="text-success" /> Basic field monitoring
                </div>
                <div className="profile-plan-feature-item">
                  <Check size={16} className="text-success" /> AI recommendations (limited)
                </div>
                <div className="profile-plan-feature-item">
                  <Check size={16} className="text-success" /> Community support
                </div>
              </div>
              <div className="profile-plan-btn-wrapper">
                <button className="profile-upgrade-btn">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) - Activity Summary */}
        <div className="profile-sidebar">
          <div className="profile-sidebar-header">
            <h3 className="profile-sidebar-title">Activity Summary</h3>
            <button className="profile-sidebar-filter">
              Last 30 Days <ChevronDown size={14} />
            </button>
          </div>

          <div className="profile-activity-grid">
            
            <div className="profile-activity-card">
              <div className="profile-activity-header">
                <div className="profile-activity-icon-wrapper success">
                  <Sprout size={20} />
                </div>
                <div>
                  <h4 className="profile-activity-value">18</h4>
                  <p className="profile-activity-label">Field Scans</p>
                </div>
              </div>
              <p className="profile-activity-trend up">
                <span className="profile-activity-trend-icon">&uarr;</span> 20% from last 30 days
              </p>
            </div>

            <div className="profile-activity-card">
              <div className="profile-activity-header">
                <div className="profile-activity-icon-wrapper info">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="profile-activity-value">7</h4>
                  <p className="profile-activity-label">Expert Chats</p>
                </div>
              </div>
              <p className="profile-activity-trend up">
                <span className="profile-activity-trend-icon">&uarr;</span> 16% from last 30 days
              </p>
            </div>

            <div className="profile-activity-card">
              <div className="profile-activity-header">
                <div className="profile-activity-icon-wrapper warning">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="profile-activity-value">3</h4>
                  <p className="profile-activity-label">Alerts Received</p>
                </div>
              </div>
              <p className="profile-activity-trend down">
                <span className="profile-activity-trend-icon">&darr;</span> 25% from last 30 days
              </p>
            </div>

            <div className="profile-activity-card">
              <div className="profile-activity-header">
                <div className="profile-activity-icon-wrapper purple">
                  <ListTodo size={20} />
                </div>
                <div>
                  <h4 className="profile-activity-value">12</h4>
                  <p className="profile-activity-label">Recommendations</p>
                </div>
              </div>
              <p className="profile-activity-trend up">
                <span className="profile-activity-trend-icon">&uarr;</span> 33% from last 30 days
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Quick Links Banner */}
      <div className="profile-quick-links-card">
        <h3 className="profile-section-title">Quick Links</h3>
        
        <div className="profile-quick-links-grid">
          
          <Link to="/fields" className="profile-quick-link-item">
            <div className="profile-quick-link-content">
              <Leaf size={24} strokeWidth={1.5} className="profile-quick-link-icon" />
              <div>
                <h4 className="profile-quick-link-title">My Fields</h4>
                <p className="profile-quick-link-desc">View and manage<br/>your fields</p>
              </div>
            </div>
            <ChevronRight size={16} className="profile-quick-link-chevron" />
          </Link>

          <Link to="/diagnosis" className="profile-quick-link-item">
            <div className="profile-quick-link-content">
              <ShieldCheck size={24} strokeWidth={1.5} className="profile-quick-link-icon" />
              <div>
                <h4 className="profile-quick-link-title">Crop Diagnosis</h4>
                <p className="profile-quick-link-desc">Diagnose crop<br/>issues</p>
              </div>
            </div>
            <ChevronRight size={16} className="profile-quick-link-chevron" />
          </Link>

          <Link to="/expert" className="profile-quick-link-item">
            <div className="profile-quick-link-content">
              <User size={24} strokeWidth={1.5} className="profile-quick-link-icon" />
              <div>
                <h4 className="profile-quick-link-title">Expert Support</h4>
                <p className="profile-quick-link-desc">Get help from<br/>experts</p>
              </div>
            </div>
            <ChevronRight size={16} className="profile-quick-link-chevron" />
          </Link>

          <Link to="/settings" className="profile-quick-link-item">
            <div className="profile-quick-link-content">
              <Settings size={24} strokeWidth={1.5} className="profile-quick-link-icon" />
              <div>
                <h4 className="profile-quick-link-title">Settings</h4>
                <p className="profile-quick-link-desc">Manage account<br/>and preferences</p>
              </div>
            </div>
            <ChevronRight size={16} className="profile-quick-link-chevron" />
          </Link>

        </div>
      </div>

      {/* Footer Info Banner */}
      <div className="profile-info-banner">
        <Info size={18} className="profile-info-icon" />
        <p className="profile-info-text">Keep your profile information updated to get personalized recommendations and better insights.</p>
      </div>

    </div>
  );
};
