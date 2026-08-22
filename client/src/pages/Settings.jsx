import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Settings as SettingsIcon,
  User,
  Save,
  Brain,
  Globe,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";
import { useAuth } from "../app/providers/AuthProvider";

import "./Settings.css";

const DEFAULT_SETTINGS = {
  enableSounds: true,
  personalizedRecs: true,
  voiceResponses: false,
  autoReadRecs: false,
  permissions: {
    crop: true,
    soil: true,
    weather: true,
    history: true,
    health: true,
    irrigation: true,
  },
  adviceLevel: "Simple",
  language: "English",
  timezone: "Asia/Kolkata",
};

export const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  // Data state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const settingsRes = await cropApi.getSettings();
        if (!mounted) return;
        if (settingsRes?.settings) {
          setSettings(prev => ({ ...DEFAULT_SETTINGS, ...settingsRes.settings }));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const updateSetting = (key, value) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const togglePermission = (key) =>
    setSettings(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));

  const handleSave = async () => {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const response = await cropApi.updateSettings(settings);
      if (response?.settings) {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...response.settings }));
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[Settings] Save failed:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) { /* swallow */ }
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    alert("Account deletion would be handled here in production.");
    setShowDeleteConfirm(false);
  };

  // --- Save Button ---
  const SaveButton = () => (
    <div className="settings-save-section">
      <button
        className={`settings-save-btn ${saveStatus}`}
        onClick={handleSave}
        disabled={saveStatus === "saving"}
      >
        {saveStatus === "idle"   && <><Save size={16} /> Save Changes</>}
        {saveStatus === "saving" && <><Loader2 size={16} className="settings-spin" /> Saving...</>}
        {saveStatus === "saved"  && <><CheckCircle2 size={16} /> Saved!</>}
        {saveStatus === "error"  && <><XCircle size={16} /> Failed — Try Again</>}
      </button>
    </div>
  );

  // --- Tab Content ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="settings-loading">
          <Loader2 size={24} className="settings-spin" />
          <span>Loading settings...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "general":
        return (
          <>
            <h3 className="settings-section-title">General Settings</h3>

            <div className="settings-form-group">
              {/* Personal info banner */}
              <div className="settings-info-banner">
                <User size={18} className="settings-info-icon" />
                <div className="settings-info-content">
                  <span className="settings-info-heading">Personal Information</span>
                  <span className="settings-info-text">Name, email, phone, and location are managed in your profile.</span>
                  <Link to="/profile" className="settings-link-text">Manage personal info in your Profile →</Link>
                </div>
              </div>

              {/* Language & Timezone */}
              <div className="settings-grid-2col">
                <div className="settings-form-row-top">
                  <label className="settings-label">Language</label>
                  <div className="settings-select-wrapper">
                    <select
                      className="settings-select"
                      value={settings.language}
                      onChange={(e) => updateSetting("language", e.target.value)}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                    </select>
                    <div className="settings-select-icon">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div className="settings-form-row-top">
                  <label className="settings-label">Time Zone</label>
                  <div className="settings-select-wrapper">
                    <select
                      className="settings-select"
                      value={settings.timezone}
                      onChange={(e) => updateSetting("timezone", e.target.value)}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                    <div className="settings-select-icon">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sounds toggle */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Enable Sounds</p>
                  <p className="settings-toggle-desc">Play sounds for alerts and notifications</p>
                </div>
                <button
                  className={`settings-toggle ${settings.enableSounds ? "on" : "off"}`}
                  onClick={() => updateSetting("enableSounds", !settings.enableSounds)}
                  role="switch"
                  aria-checked={settings.enableSounds}
                  aria-label="Enable sounds"
                >
                  <div className="settings-toggle-knob" />
                </button>
              </div>
            </div>

            <SaveButton />
          </>
        );

      case "ai":
        return (
          <>
            <h3 className="settings-section-title">AI Preferences</h3>

            <div className="settings-form-group">
              {/* Personalized recs */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Personalized recommendations</p>
                  <p className="settings-toggle-desc">Use my farm and field information when generating recommendations</p>
                </div>
                <button
                  className={`settings-toggle ${settings.personalizedRecs ? "on" : "off"}`}
                  onClick={() => updateSetting("personalizedRecs", !settings.personalizedRecs)}
                  role="switch"
                  aria-checked={settings.personalizedRecs}
                  aria-label="Personalized recommendations"
                >
                  <div className="settings-toggle-knob" />
                </button>
              </div>

              {/* Data permissions */}
              <div className="settings-form-row-top">
                <label className="settings-label">Data Usage Permissions</label>
                <div className="settings-checkbox-group">
                  {[
                    { key: "crop",       label: "Current crop" },
                    { key: "soil",       label: "Soil information" },
                    { key: "weather",    label: "Weather" },
                    { key: "history",    label: "Crop history" },
                    { key: "health",     label: "Field health" },
                    { key: "irrigation", label: "Irrigation information" },
                  ].map(({ key, label }) => (
                    <label key={key} className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.permissions[key]}
                        onChange={() => togglePermission(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Advice level */}
              <div className="settings-form-row-top settings-divider-top">
                <label className="settings-label">Advice Level</label>
                <div className="settings-radio-group">
                  {["Simple", "Detailed", "Expert"].map((level) => (
                    <label key={level} className="settings-radio-label">
                      <input
                        type="radio"
                        name="advice-level"
                        checked={settings.adviceLevel === level}
                        onChange={() => updateSetting("adviceLevel", level)}
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>

              {/* Voice responses */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Voice responses</p>
                  <p className="settings-toggle-desc">Allow AgriMesh AI to speak responses aloud</p>
                </div>
                <button
                  className={`settings-toggle ${settings.voiceResponses ? "on" : "off"}`}
                  onClick={() => updateSetting("voiceResponses", !settings.voiceResponses)}
                  role="switch"
                  aria-checked={settings.voiceResponses}
                  aria-label="Voice responses"
                >
                  <div className="settings-toggle-knob" />
                </button>
              </div>

              {/* Auto-read */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Auto-read recommendations</p>
                  <p className="settings-toggle-desc">Automatically play voice responses for critical alerts</p>
                </div>
                <button
                  className={`settings-toggle ${settings.autoReadRecs ? "on" : "off"}`}
                  onClick={() => updateSetting("autoReadRecs", !settings.autoReadRecs)}
                  role="switch"
                  aria-checked={settings.autoReadRecs}
                  aria-label="Auto-read recommendations"
                >
                  <div className="settings-toggle-knob" />
                </button>
              </div>
            </div>

            <SaveButton />
          </>
        );

      case "account":
        return (
          <>
            <h3 className="settings-section-title">Account Settings</h3>

            <div className="settings-form-group">
              {/* Logout card */}
              <div className="settings-account-card">
                <h3 className="settings-account-card-title">Account Actions</h3>
                <div className="settings-account-row">
                  <span className="settings-account-row-label">Sign out of your account</span>
                  <button
                    className="settings-logout-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="settings-danger-card">
                <div className="settings-danger-indicator" />
                <h3 className="settings-danger-title">Danger Zone</h3>

                <p className="settings-danger-action-title">Delete Account</p>
                <p className="settings-danger-desc">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    className="settings-danger-btn settings-danger-btn-inline"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="settings-delete-confirm-box">
                    <p className="settings-delete-confirm-title">
                      <AlertTriangle size={18} /> Are you absolutely sure?
                    </p>
                    <div className="settings-delete-confirm-actions">
                      <button className="settings-danger-btn" onClick={handleDeleteAccount}>
                        Yes, Delete My Account
                      </button>
                      <button
                        className="settings-cancel-btn"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const TABS = [
    { id: "general", label: "General",       icon: SettingsIcon },
    { id: "ai",      label: "AI Preferences", icon: Brain },
    { id: "account", label: "Account",        icon: User },
  ];

  return (
    <div className="settings-container">

      {/* Page title — visible inline (no portal needed now header always shows) */}
      <div className="settings-page-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your preferences and account</p>
      </div>

      <div className="settings-layout">
        {/* Left / Top Navigation */}
        <nav className="settings-nav-sidebar" aria-label="Settings sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-nav-btn ${activeTab === id ? "active" : "inactive"}`}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <div className="settings-main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
