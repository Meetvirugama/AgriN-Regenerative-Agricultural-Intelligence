import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Globe, 
  Map,
  Maximize,
  Leaf,
  Camera,
  Sprout,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  ChevronDown,
  Loader2
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";
import "./Profile.css";

export const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  
  // Real state
  const [profileData, setProfileData] = useState(null);
  const [profileStats, setProfileStats] = useState({
    fields: 0,
    acres: 0,
    crops: 0,
    aiInsights: 0,
  });
  const [farmingHistory, setFarmingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editFormData, setEditFormData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await cropApi.getProfile();

        if (!mounted) return;

        setProfileData(data.profile);
        setProfileStats(data.stats);
        setFarmingHistory(data.history || []);
      } catch (error) {
        console.error("Failed to load profile:", error);
        if (mounted) {
          setError("Unable to load your profile.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPortalTarget(document.getElementById('header-portal'));
    
    if (isEditModalOpen || isHistoryModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isEditModalOpen, isHistoryModalOpen]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imgUrl = URL.createObjectURL(e.target.files[0]);
      setProfileImage(imgUrl);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleOpenEditModal = () => {
    setEditFormData(profileData || {});
    setIsEditModalOpen(true);
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
  
      const response = await cropApi.updateProfile({
        name: editFormData.name,
        phone: editFormData.phone,
        email: editFormData.email,
        location: editFormData.location,
        preferredLanguage: editFormData.preferredLanguage,
        farmingExperienceYears: editFormData.farmingExperienceYears === '' 
          ? null 
          : editFormData.farmingExperienceYears
      });
  
      setProfileData(response.profile);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-container">
      
      {/* HIDDEN FILE INPUT */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />
      
      
      {/* HEADER PORTAL */}
      {portalTarget && createPortal(
        <>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="profile-title" style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>My Profile</h1>
          </div>
          <div className="dashboard-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="dashboard-header-action language" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500 }}>
              <Globe size={16} className="text-text-muted" />
              <span className="hidden md:inline">{profileData?.preferredLanguage || 'English'}</span>
              <span className="md:hidden">{profileData?.preferredLanguage?.substring(0,2) || 'En'}</span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>
            
            <div className="dashboard-header-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div className="dashboard-header-avatar" style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', overflow: 'hidden' }}>
                {profileData?.profileImageUrl ? (
                  <img src={profileData.profileImageUrl} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <User size={14} />
                )}
              </div>
              <span className="profile-name hidden md:flex" style={{ alignItems: 'center', gap: '0.25rem', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500 }}>
                {profileData?.name ? profileData.name.split(' ')[0] : 'User'} <ChevronDown size={14} className="text-text-muted" />
              </span>
            </div>
          </div>
        </>,
        portalTarget
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="profile-grid-2x2">
        
        {/* ROW 1 */}
        {/* CARD 1: Identity */}
        <div className="profile-card identity-card">
          <div className="identity-layout">
            <div className="identity-avatar-col">
              <div className="avatar-wrapper">
                <div className="avatar-placeholder" style={{ overflow: 'hidden' }}>
                  {profileData?.profileImageUrl || profileImage ? (
                    <img src={profileData?.profileImageUrl || profileImage} alt={profileData?.name || "Profile"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={80} strokeWidth={1.5} color="#4B5563" />
                  )}
                </div>
                <button className="avatar-camera-btn" onClick={triggerFileInput}>
                  <Camera size={16} />
                </button>
              </div>
            </div>
            
            <div className="identity-details-col">
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="animate-spin" /> Loading profile...
                </div>
              ) : profileData && (
                <>
                  <div className="identity-name-row">
                    <h2 className="identity-name">{profileData.name}</h2>
                    <span className="badge-farmer">Farmer</span>
                  </div>
                  
                  <div className="identity-contact-list">
                    <div className="contact-item">
                      <MapPin size={16} className="contact-icon text-success" />
                      <span>{profileData.location || "Location not set"}</span>
                    </div>
                    <div className="contact-item">
                      <Phone size={16} className="contact-icon text-success" />
                      <span>{profileData.phone || "Phone not set"}</span>
                    </div>
                    <div className="contact-item">
                      <Mail size={16} className="contact-icon text-success" />
                      <span>{profileData.email || "Email not set"}</span>
                    </div>
                  </div>
                  
                  <div className="identity-pills-row">
                    <div className="identity-pill">
                      <Globe size={16} className="pill-icon text-success" />
                      <span>{profileData.preferredLanguage || "English"}</span>
                    </div>
                    <div className="identity-pill">
                      <Sprout size={16} className="pill-icon text-success" />
                      <div className="pill-text-stack">
                        <span className="pill-val">
                          {profileData.farmingExperienceYears != null
                            ? `${profileData.farmingExperienceYears}+ years`
                            : "Not specified"}
                        </span>
                        <span className="pill-lbl">Farming Experience</span>
                      </div>
                    </div>
                    <button className="identity-pill edit-profile-pill" onClick={handleOpenEditModal}>
                      <Edit3 size={14} className="pill-icon" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Quick Stats */}
        <div className="profile-card quick-stats-card">
          <h3 className="card-title-sm">Quick Stats</h3>
          
          <div className="quick-stats-grid">
            <div className="stat-box">
              <div className="stat-icon-row">
                <Map size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">
                {isLoading ? "-" : profileStats.fields}
              </div>
              <div className="stat-lbl">Fields</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon-row">
                <Maximize size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">
                {isLoading ? "-" : (Number(profileStats.acres) || 0).toFixed(2)}
              </div>
              <div className="stat-lbl">Acres</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon-row">
                <Leaf size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">
                {isLoading ? "-" : profileStats.crops}
              </div>
              <div className="stat-lbl">Crops</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon-row">
                <Sparkles size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">
                {isLoading ? "-" : profileStats.aiInsights}
              </div>
              <div className="stat-lbl">AI Insights</div>
            </div>
          </div>

        </div>

      </div>

      {/* Full Width Row */}
      <div className="profile-card farming-history-card">
        <div className="card-header-row">
          <h3 className="card-title">Farming History</h3>
          <button className="view-all-btn" onClick={() => setIsHistoryModalOpen(true)}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="history-list history-grid">
          {isLoading ? (
            <div className="history-loading" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
              <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading farming history...</p>
            </div>
          ) : farmingHistory.length === 0 ? (
            <div className="history-empty" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sprout size={28} style={{ marginBottom: '8px', color: '#9CA3AF' }} />
              <p style={{ fontWeight: 500, color: 'var(--text-main)', margin: 0 }}>No farming history yet.</p>
              <span style={{ fontSize: '0.875rem' }}>Your crop records will appear here.</span>
            </div>
          ) : (
            farmingHistory.slice(0, 4).map((record) => (
              <div key={record.id} className="history-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{record.cropType}</h4>
                  {record.cropVariety && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.cropVariety}</span>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                    {record.areaAcres ? `${Number(record.areaAcres).toFixed(2)} acres` : "Area unavailable"}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#ECFDF5', color: '#059669', fontWeight: 500 }}>
                    {record.status || "Active"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="profile-img-edit">
              <div className="avatar-placeholder" style={{ overflow: 'hidden' }}>
                {profileData?.profileImageUrl || profileImage ? (
                  <img src={profileData?.profileImageUrl || profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} strokeWidth={1.5} color="#4B5563" />
                )}
              </div>
              <div>
                <button className="change-photo-btn" onClick={triggerFileInput}>Change Photo</button>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Upload endpoint pending implementation</div>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={editFormData.name || ''} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={editFormData.phone || ''} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" value={editFormData.location || ''} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Preferred Language</label>
              <select 
                value={editFormData.preferredLanguage || 'English'} 
                onChange={(e) => setEditFormData({...editFormData, preferredLanguage: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', marginTop: '0.25rem' }}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>

            <div className="form-group">
              <label>Farming Experience (Years)</label>
              <input 
                type="number" 
                min="0"
                value={editFormData.farmingExperienceYears ?? ''} 
                onChange={(e) => setEditFormData({...editFormData, farmingExperienceYears: e.target.value})} 
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
              <button className="btn-save" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </span>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3>Farming History</h3>
              <button className="close-btn" onClick={() => setIsHistoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="history-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              {farmingHistory.length === 0 ? (
                <div className="history-empty" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>
                  No farming records found.
                </div>
              ) : (
                farmingHistory.map((record) => (
                  <div key={record.id} className="history-modal-item" style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center' }}>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '14px' }}>
                        {record.cropType}
                      </strong>
                      {record.cropVariety && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {record.cropVariety}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Sowing:{" "}
                      {record.sowingDate
                        ? new Date(record.sowingDate).toLocaleDateString()
                        : "—"}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Harvest:{" "}
                      {record.harvestDate
                        ? new Date(record.harvestDate).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
