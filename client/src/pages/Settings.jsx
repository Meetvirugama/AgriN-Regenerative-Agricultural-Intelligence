import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { 
  Settings as SettingsIcon,
  Shield,
  User,
  Save,
  Brain,
  Globe,
  ChevronDown
} from "lucide-react";

import "./Settings.css";

export const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [portalTarget, setPortalTarget] = useState(null);

  // Toggle states
  const [enableSounds, setEnableSounds] = useState(() => {
    const saved = localStorage.getItem('settings_enableSounds');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [personalizedRecs, setPersonalizedRecs] = useState(() => {
    const saved = localStorage.getItem('settings_personalizedRecs');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [voiceResponses, setVoiceResponses] = useState(() => {
    const saved = localStorage.getItem('settings_voiceResponses');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [autoReadRecs, setAutoReadRecs] = useState(() => {
    const saved = localStorage.getItem('settings_autoReadRecs');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Checkbox states
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('settings_permissions');
    return saved !== null ? JSON.parse(saved) : {
      crop: true, soil: true, weather: true, history: true, health: true, irrigation: true
    };
  });
  
  const togglePermission = (key) => setPermissions(p => ({...p, [key]: !p[key]}));

  // Dropdown/Radio states
  const [adviceLevel, setAdviceLevel] = useState(() => {
    const saved = localStorage.getItem('settings_adviceLevel');
    return saved !== null ? JSON.parse(saved) : 'Simple';
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('settings_language');
    return saved !== null ? JSON.parse(saved) : 'English';
  });
  const [timeZone, setTimeZone] = useState(() => {
    const saved = localStorage.getItem('settings_timeZone');
    return saved !== null ? JSON.parse(saved) : 'Asia/Kolkata (IST)';
  });

  // Save state simulation
  const [saveStatus, setSaveStatus] = useState("idle");
  const handleSave = () => {
    if (saveStatus !== "idle") return;
    setSaveStatus("saving");
    
    localStorage.setItem('settings_enableSounds', JSON.stringify(enableSounds));
    localStorage.setItem('settings_personalizedRecs', JSON.stringify(personalizedRecs));
    localStorage.setItem('settings_voiceResponses', JSON.stringify(voiceResponses));
    localStorage.setItem('settings_autoReadRecs', JSON.stringify(autoReadRecs));
    localStorage.setItem('settings_permissions', JSON.stringify(permissions));
    localStorage.setItem('settings_adviceLevel', JSON.stringify(adviceLevel));
    localStorage.setItem('settings_language', JSON.stringify(language));
    localStorage.setItem('settings_timeZone', JSON.stringify(timeZone));

    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
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
                    <select className="settings-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option value="English">English</option>
                      <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                      <option value="Marathi (मराठी)">Marathi (मराठी)</option>
                      <option value="Punjabi (ਪੰਜਾਬੀ)">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="Gujarati (ગુજરાતી)">Gujarati (ગુજરાતી)</option>
                    </select>
                    <div className="settings-select-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div className="settings-form-row-top">
                  <label className="settings-label">Time Zone</label>
                  <div className="settings-select-wrapper">
                    <select className="settings-select" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
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
                  className={`settings-toggle ${enableSounds ? 'on' : 'off'}`} 
                  onClick={() => setEnableSounds(!enableSounds)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

            </div>

            <div className="settings-save-section">
              <button className="settings-save-btn" onClick={handleSave} disabled={saveStatus !== 'idle'}>
                {saveStatus === 'idle' && <><Save size={18} /> Save Changes</>}
                {saveStatus === 'saving' && <>Saving...</>}
                {saveStatus === 'saved' && <>Saved!</>}
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
                  className={`settings-toggle ${personalizedRecs ? 'on' : 'off'}`}
                  onClick={() => setPersonalizedRecs(!personalizedRecs)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

              <div className="settings-form-row-top">
                <label className="settings-label">Data Usage Permissions</label>
                <div className="settings-checkbox-group">
                  <label className="settings-checkbox-label"><input type="checkbox" checked={permissions.crop} onChange={() => togglePermission('crop')} /> Current crop</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={permissions.soil} onChange={() => togglePermission('soil')} /> Soil information</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={permissions.weather} onChange={() => togglePermission('weather')} /> Weather</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={permissions.history} onChange={() => togglePermission('history')} /> Crop history</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={permissions.health} onChange={() => togglePermission('health')} /> Field health</label>
                  <label className="settings-checkbox-label"><input type="checkbox" checked={permissions.irrigation} onChange={() => togglePermission('irrigation')} /> Irrigation information</label>
                </div>
              </div>

              <div className="settings-form-row-top" style={{ borderTop: '1px solid rgba(229, 231, 235, 0.6)', paddingTop: '0.5rem' }}>
                <label className="settings-label">Advice Level</label>
                <div className="settings-radio-group">
                  <label className="settings-radio-label"><input type="radio" name="advice-level" checked={adviceLevel === 'Simple'} onChange={() => setAdviceLevel('Simple')} /> Simple</label>
                  <label className="settings-radio-label"><input type="radio" name="advice-level" checked={adviceLevel === 'Detailed'} onChange={() => setAdviceLevel('Detailed')} /> Detailed</label>
                  <label className="settings-radio-label"><input type="radio" name="advice-level" checked={adviceLevel === 'Expert'} onChange={() => setAdviceLevel('Expert')} /> Expert</label>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Voice responses</p>
                  <p className="settings-toggle-desc">Allow AgriMesh AI to speak responses aloud</p>
                </div>
                <div 
                  className={`settings-toggle ${voiceResponses ? 'on' : 'off'}`}
                  onClick={() => setVoiceResponses(!voiceResponses)}
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
                  className={`settings-toggle ${autoReadRecs ? 'on' : 'off'}`}
                  onClick={() => setAutoReadRecs(!autoReadRecs)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

            </div>

            <div className="settings-save-section">
              <button className="settings-save-btn" onClick={handleSave} disabled={saveStatus !== 'idle'}>
                {saveStatus === 'idle' && <><Save size={18} /> Save Changes</>}
                {saveStatus === 'saving' && <>Saving...</>}
                {saveStatus === 'saved' && <>Saved!</>}
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
                    <button className="settings-sidebar-action-btn" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Logout</button>
                  </div>
                </div>
              </div>

              <div className="settings-danger-card" style={{ width: '100%' }}>
                <div className="settings-danger-indicator"></div>
                <h3 className="settings-danger-title">Danger Zone</h3>
                


                <div>
                  <p className="settings-danger-action-title">Delete Account</p>
                  <p className="settings-danger-desc">This action cannot be undone. All your data will be permanently deleted.</p>
                  <button className="settings-danger-btn" style={{ maxWidth: '200px' }}>
                    Delete Account
                  </button>
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
              <span className="hidden md:inline">English</span>
              <span className="md:hidden">En</span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>
            
            <div className="dashboard-header-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div className="dashboard-header-avatar" style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                <User size={14} />
              </div>
              <span className="profile-name hidden md:flex" style={{ alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500 }}>
                Ramesh <ChevronDown size={14} className="text-text-muted" />
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
