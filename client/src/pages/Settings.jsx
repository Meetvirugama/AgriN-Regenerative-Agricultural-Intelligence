import React from "react";
import { 
  Settings as SettingsIcon,
  Bell,
  Leaf,
  Shield,
  Globe,
  Link as LinkIcon,
  User,
  Sun,
  Moon,
  Monitor,
  Save,
  ChevronRight,
  Info
} from "lucide-react";

import "./Settings.css";

export const Settings = () => {
  return (
    <div className="settings-container">
      
      {/* HEADER */}
      <div>
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your preferences and application settings</p>
      </div>

      <div className="settings-layout">
        
        {/* Left Navigation Sidebar */}
        <div className="settings-nav-sidebar">
          <button className="settings-nav-btn active">
            <SettingsIcon size={18} /> General
          </button>
          <button className="settings-nav-btn inactive">
            <Bell size={18} /> Notifications
          </button>
          <button className="settings-nav-btn inactive">
            <Leaf size={18} /> Field Preferences
          </button>
          <button className="settings-nav-btn inactive">
            <Shield size={18} /> Data & Privacy
          </button>
          <button className="settings-nav-btn inactive">
            <Globe size={18} /> Units & Language
          </button>
          <button className="settings-nav-btn inactive">
            <LinkIcon size={18} /> Integration
          </button>
          <button className="settings-nav-btn inactive">
            <User size={18} /> Account
          </button>
        </div>

        {/* Main Content Area */}
        <div className="settings-main-content">
          <h3 className="settings-section-title">General Settings</h3>
          
          <div className="settings-form-group">
            
            {/* Form Group */}
            <div className="settings-form-row">
              <label className="settings-label">Full Name</label>
              <input type="text" defaultValue="Ramesh Kumar" className="settings-input" />
            </div>

            <div className="settings-form-row">
              <label className="settings-label">Email Address</label>
              <input type="email" defaultValue="ramesh.kumar@example.com" className="settings-input" />
            </div>

            <div className="settings-form-row">
              <label className="settings-label">Phone Number</label>
              <input type="tel" defaultValue="+91 98765 43210" className="settings-input" />
            </div>

            <div className="settings-form-row">
              <label className="settings-label">Location</label>
              <input type="text" defaultValue="Madhopur, Uttar Pradesh, India" className="settings-input" />
            </div>

            <div className="settings-form-row">
              <label className="settings-label">Language</label>
              <div className="settings-select-wrapper">
                <select className="settings-select">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                </select>
                <div className="settings-select-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="settings-form-row-top">
              <label className="settings-label">Theme</label>
              <div className="settings-theme-group">
                <button className="settings-theme-btn active">
                  <Sun size={16} /> Light
                </button>
                <button className="settings-theme-btn inactive">
                  <Moon size={16} /> Dark
                </button>
                <button className="settings-theme-btn inactive">
                  <Monitor size={16} /> System
                </button>
              </div>
            </div>

            <div className="settings-form-row-top">
              <label className="settings-label">Dashboard Default View</label>
              <div className="settings-select-wrapper">
                <select className="settings-select">
                  <option>Overview</option>
                  <option>List</option>
                  <option>Map</option>
                </select>
                <div className="settings-select-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="settings-form-row">
              <label className="settings-label">Time Zone</label>
              <div className="settings-select-wrapper">
                <select className="settings-select">
                  <option>Asia/Kolkata (IST)</option>
                </select>
                <div className="settings-select-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="settings-toggle-row">
              <div>
                <p className="settings-toggle-label">Enable Sounds</p>
                <p className="settings-toggle-desc">Play sounds for alerts and notifications</p>
              </div>
              <div className="settings-toggle on">
                <div className="settings-toggle-knob"></div>
              </div>
            </div>

          </div>

          <div className="settings-save-section">
            <button className="settings-save-btn">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="settings-right-sidebar">
          
          {/* Notification Preferences */}
          <div className="settings-sidebar-card">
            <h3 className="settings-sidebar-title">Notification Preferences</h3>
            
            <div className="settings-sidebar-list">
              <div className="settings-sidebar-item">
                <span className="settings-sidebar-label">Email Notifications</span>
                <div className="settings-toggle on"><div className="settings-toggle-knob"></div></div>
              </div>
              <div className="settings-sidebar-item">
                <span className="settings-sidebar-label">Push Notifications</span>
                <div className="settings-toggle on"><div className="settings-toggle-knob"></div></div>
              </div>
              <div className="settings-sidebar-item">
                <span className="settings-sidebar-label">SMS Alerts</span>
                <div className="settings-toggle off"><div className="settings-toggle-knob"></div></div>
              </div>
              <div className="settings-sidebar-item">
                <span className="settings-sidebar-label">Weekly Summary Email</span>
                <div className="settings-toggle on"><div className="settings-toggle-knob"></div></div>
              </div>
            </div>

            <button className="settings-sidebar-link-btn">
              Manage Notifications <ChevronRight size={12} />
            </button>
          </div>

          {/* Data & Storage */}
          <div className="settings-sidebar-card">
            <h3 className="settings-sidebar-title">Data & Storage</h3>
            
            <div className="settings-sidebar-list">
              <div className="settings-sidebar-item">
                <span className="settings-sidebar-label">Cache Data</span>
                <div className="settings-sidebar-item-group">
                  <span className="settings-sidebar-value">24.5 MB</span>
                  <button className="settings-sidebar-action-btn">Clear Cache</button>
                </div>
              </div>
              <div className="settings-sidebar-item">
                <span className="settings-sidebar-label">Offline Data</span>
                <div className="settings-sidebar-item-group">
                  <span className="settings-sidebar-value">12.1 MB</span>
                  <button className="settings-sidebar-action-btn">Manage Data</button>
                </div>
              </div>
              <div className="settings-sidebar-total">
                <span className="settings-sidebar-total-label">Total Storage Used</span>
                <span className="settings-sidebar-total-value">36.6 MB</span>
              </div>
            </div>

            <button className="settings-sidebar-link-btn">
              View Storage Details <ChevronRight size={12} />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="settings-danger-card">
            <div className="settings-danger-indicator"></div>
            <h3 className="settings-danger-title">Danger Zone</h3>
            
            <div>
              <p className="settings-danger-action-title">Delete Account</p>
              <p className="settings-danger-desc">This action cannot be undone. All your data will be permanently deleted.</p>
              <button className="settings-danger-btn">
                Delete Account
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Info Banner */}
      <div className="settings-info-banner">
        <Info size={18} className="settings-info-icon" />
        <p className="settings-info-text">Your preferences help us provide a better and personalized AgriMesh experience.</p>
      </div>

    </div>
  );
};
