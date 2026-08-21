import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { 
  Settings as SettingsIcon,
  Shield,
  User,
  Save,
  Brain,
  Globe,
  ChevronDown,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";
import { authApi } from "../features/auth/api/authApi";

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
  const [activeTab, setActiveTab] = useState("general");
  const [portalTarget, setPortalTarget] = useState(null);
  
  // Real data state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'
  const [userProfile, setUserProfile] = useState(null);
  
  // Danger zone states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load both settings and profile (for header name)
        const [settingsRes, profileRes] = await Promise.all([
          cropApi.getSettings(),
          cropApi.getProfile().catch(() => null)
        ]);

        if (!mounted) return;

        if (settingsRes && settingsRes.settings) {
          setSettings(settingsRes.settings);
        }
        if (profileRes && profileRes.profile) {
          setUserProfile(profileRes.profile);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const togglePermission = (key) => {
    setSettings((previous) => ({
      ...previous,
      permissions: {
        ...previous.permissions,
        [key]: !previous.permissions[key],
      },
    }));
  };

  const handleSave = async () => {
    if (saveStatus === "saving") return;

    try {
      setSaveStatus("saving");
      
      const response = await cropApi.updateSettings(settings);
      
      setSettings(response.settings);
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("[Settings] Save failed:", error);
      setSaveStatus("error");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear token from local storage (if any)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      
      // Attempt backend logout if possible
      // await authApi.logout(accessToken, refreshToken).catch(e => console.warn(e));
      
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login"); // Force navigation on error
    }
  };

  const handleDeleteAccount = () => {
    alert("Account deletion would be handled here in production by calling DELETE /api/v1/account and purging user data.");
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    setPortalTarget(document.getElementById('header-portal'));
    
    const dashboardContent = document.querySelector('.dashboard-content');
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        if (dashboardContent) dashboardContent.style.overflowY = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        if (dashboardContent) dashboardContent.style.overflowY = 'auto';
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (dashboardContent) dashboardContent.style.overflowY = 'auto';
    };
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ marginRight: '8px' }} />
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
              
              <div className="settings-info-banner">
                <User size={18} className="settings-info-icon" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="settings-info-text" style={{ fontWeight: '700' }}>Personal Information</span>
                  <span className="settings-info-text" style={{ color: 'var(--text-muted)' }}>Name, email, phone, and location are managed in your profile.</span>
                  <Link to="/profile" className="settings-link-text">Manage personal info in your Profile &rarr;</Link>
                </div>
              </div>

              {/* Side-by-side grid for Language and Time Zone */}
              <div className="settings-grid-2col">
                <div className="settings-form-row-top">
                  <label className="settings-label">Language</label>
                  <div className="settings-select-wrapper">
                    <select className="settings-select" value={settings.language} onChange={(e) => updateSetting("language", e.target.value)}>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                    </select>
                    <div className="settings-select-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div className="settings-form-row-top">
                  <label className="settings-label">Time Zone</label>
                  <div className="settings-select-wrapper">
                    <select className="settings-select" value={settings.timezone} onChange={(e) => updateSetting("timezone", e.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                    <div className="settings-select-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Enable Sounds</p>
                  <p className="settings-toggle-desc">Play sounds for alerts and notifications</p>
                </div>
                <div 
                  className={`settings-toggle ${settings.enableSounds ? 'on' : 'off'}`} 
                  onClick={() => updateSetting("enableSounds", !settings.enableSounds)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

            </div>

            <div className="settings-save-section">
              <button className="settings-save-btn" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'idle' && <><Save size={18} /> Save Changes</>}
                {saveStatus === 'saving' && <><Loader2 size={18} className="animate-spin" /> Saving...</>}
                {saveStatus === 'saved' && <>Saved!</>}
                {saveStatus === 'error' && <>Failed — Try Again</>}
              </button>
            </div>
          </>
        );

      case "ai":
        return (
          <>
            <h3 className="settings-section-title">AI Preferences</h3>
            
            <div className="settings-form-group">
              
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Personalized recommendations</p>
                  <p className="settings-toggle-desc">Use my farm and field information when generating recommendations</p>
                </div>
                <div 
                  className={`settings-toggle ${settings.personalizedRecs ? 'on' : 'off'}`}
                  onClick={() => updateSetting("personalizedRecs", !settings.personalizedRecs)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

              <div className="settings-form-row-top">
                <label className="settings-label">Data Usage Permissions</label>
                <div className="settings-checkbox-group">
                  <label className="settings-checkbox-label"><input type="checkbox" checked={settings.permissions.crop} onChange={() => togglePermission('crop')} /> Current crop</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={settings.permissions.soil} onChange={() => togglePermission('soil')} /> Soil information</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={settings.permissions.weather} onChange={() => togglePermission('weather')} /> Weather</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={settings.permissions.history} onChange={() => togglePermission('history')} /> Crop history</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={settings.permissions.health} onChange={() => togglePermission('health')} /> Field health</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={settings.permissions.irrigation} onChange={() => togglePermission('irrigation')} /> Irrigation information</label>
                </div>
              </div>

              <div className="settings-form-row-top" style={{ borderTop: '1px solid rgba(229, 231, 235, 0.6)', paddingTop: '0.5rem' }}>
                <label className="settings-label">Advice Level</label>
                <div className="settings-radio-group">
                  <label className="settings-radio-label"><input type="radio" name="advice-level" checked={settings.adviceLevel === 'Simple'} onChange={() => updateSetting('adviceLevel', 'Simple')} /> Simple</label>
                  <label className="settings-radio-label"><input type="radio" name="advice-level" checked={settings.adviceLevel === 'Detailed'} onChange={() => updateSetting('adviceLevel', 'Detailed')} /> Detailed</label>
                  <label className="settings-radio-label"><input type="radio" name="advice-level" checked={settings.adviceLevel === 'Expert'} onChange={() => updateSetting('adviceLevel', 'Expert')} /> Expert</label>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Voice responses</p>
                  <p className="settings-toggle-desc">Allow AgriMesh AI to speak responses aloud</p>
                </div>
                <div 
                  className={`settings-toggle ${settings.voiceResponses ? 'on' : 'off'}`}
                  onClick={() => updateSetting("voiceResponses", !settings.voiceResponses)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Auto-read recommendations</p>
                  <p className="settings-toggle-desc">Automatically play voice responses for critical alerts</p>
                </div>
                <div 
                  className={`settings-toggle ${settings.autoReadRecs ? 'on' : 'off'}`}
                  onClick={() => updateSetting("autoReadRecs", !settings.autoReadRecs)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

            </div>

            <div className="settings-save-section">
              <button className="settings-save-btn" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'idle' && <><Save size={18} /> Save Changes</>}
                {saveStatus === 'saving' && <><Loader2 size={18} className="animate-spin" /> Saving...</>}
                {saveStatus === 'saved' && <>Saved!</>}
                {saveStatus === 'error' && <>Failed — Try Again</>}
              </button>
            </div>
          </>
        );


      case "account":
        return (
          <>
            <h3 className="settings-section-title">Account Settings</h3>
            
            <div className="settings-form-group">
              
              <div className="settings-sidebar-card" style={{ width: '100%' }}>
                <h3 className="settings-sidebar-title">Account Actions</h3>
                <div className="settings-sidebar-list">

                  <div className="settings-sidebar-item">
                    <span className="settings-sidebar-label">Logout</span>
                    <button className="settings-sidebar-action-btn" onClick={handleLogout} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Logout</button>
                  </div>
                </div>
              </div>

              <div className="settings-danger-card" style={{ width: '100%' }}>
                <div className="settings-danger-indicator"></div>
                <h3 className="settings-danger-title">Danger Zone</h3>
                
                <div>
                  <p className="settings-danger-action-title">Delete Account</p>
                  <p className="settings-danger-desc">This action cannot be undone. All your data will be permanently deleted.</p>
                  
                  {!showDeleteConfirm ? (
                    <button className="settings-danger-btn" style={{ maxWidth: '200px' }} onClick={() => setShowDeleteConfirm(true)}>
                      Delete Account
                    </button>
                  ) : (
                    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--danger)', borderRadius: '8px', backgroundColor: '#FEF2F2' }}>
                      <p style={{ color: 'var(--danger)', fontWeight: 600, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} /> Are you absolutely sure?
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="settings-danger-btn" onClick={handleDeleteAccount}>Yes, Delete My Account</button>
                        <button className="settings-sidebar-action-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      
      {/* HEADER PORTAL */}
      {portalTarget && createPortal(
        <>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="settings-title" style={{ margin: 0, fontSize: '1.5rem', lineHeight: '2rem' }}>Settings</h1>
          </div>
          <div className="dashboard-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="dashboard-header-action language" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500 }}>
              <Globe size={16} className="text-text-muted" />
              <span className="hidden md:inline">{settings.language}</span>
              <span className="md:hidden">{settings.language.substring(0, 2)}</span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>
            
            <div className="dashboard-header-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div className="dashboard-header-avatar" style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', overflow: 'hidden' }}>
                {userProfile?.profileImageUrl ? (
                  <img src={userProfile.profileImageUrl} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <User size={14} />
                )}
              </div>
              <span className="profile-name hidden md:flex" style={{ alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500 }}>
                {userProfile?.name ? userProfile.name.split(" ")[0] : "Farmer"} <ChevronDown size={14} className="text-text-muted" />
              </span>
            </div>
          </div>
        </>,
        portalTarget
      )}

      <div className="settings-layout">
        
        {/* Left Navigation Sidebar */}
        <div className="settings-nav-sidebar">
          <button 
            className={`settings-nav-btn ${activeTab === 'general' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('general')}
          >
            <SettingsIcon size={18} /> General
          </button>
          <button 
            className={`settings-nav-btn ${activeTab === 'ai' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('ai')}
          >
            <Brain size={18} /> AI Preferences
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'account' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('account')}
          >
            <User size={18} /> Account
          </button>
        </div>

        {/* Main Content Area */}
        <div className="settings-main-content">
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default Settings;
