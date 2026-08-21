import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
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
  Leaf, 
  ShieldCheck,
  Camera,
  Droplet,
  TrendingUp,
  AlertTriangle,
  Syringe,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  ChevronDown
} from "lucide-react";
import "./Profile.css";

export const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

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

  const [profileData, setProfileData] = useState({
    name: "Ramesh Kumar",
    phone: "+91 98765 43210",
    email: "ramesh.kumar@example.com",
    location: "Madhopur, Uttar Pradesh"
  });
  
  const [editFormData, setEditFormData] = useState(profileData);
  
  const handleOpenEditModal = () => {
    setEditFormData(profileData);
    setIsEditModalOpen(true);
  };
  
  const handleSaveProfile = () => {
    setProfileData(editFormData);
    setIsEditModalOpen(false);
  };

  React.useEffect(() => {
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
            <h1 className="profile-title" style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>My Profile</h1>
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
                {profileData.name.split(' ')[0]} <ChevronDown size={14} className="text-text-muted" />
              </span>
            </div>
          </div>
        </>,
        portalTarget
      )}

      <div className="profile-grid-2x2">
        
        {/* ROW 1 */}
        {/* CARD 1: Identity */}
        <div className="profile-card identity-card">
          <div className="identity-layout">
            <div className="identity-avatar-col">
              <div className="avatar-wrapper">
                {/* Placeholder for actual image. Using a colorful gradient/icon for now */}
                <div className="avatar-placeholder" style={{ overflow: 'hidden' }}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <div className="identity-name-row">
                <h2 className="identity-name">{profileData.name}</h2>
                <span className="badge-farmer">Farmer</span>
              </div>
              
              <div className="identity-contact-list">
                <div className="contact-item">
                  <MapPin size={16} className="contact-icon text-success" />
                  <span>{profileData.location}</span>
                </div>
                <div className="contact-item">
                  <Phone size={16} className="contact-icon text-success" />
                  <span>{profileData.phone}</span>
                </div>
                <div className="contact-item">
                  <Mail size={16} className="contact-icon text-success" />
                  <span>{profileData.email}</span>
                </div>
              </div>
              
              <div className="identity-pills-row">
                <div className="identity-pill">
                  <Globe size={16} className="pill-icon text-success" />
                  <span>English</span>
                </div>
                <div className="identity-pill">
                  <Sprout size={16} className="pill-icon text-success" />
                  <div className="pill-text-stack">
                    <span className="pill-val">8+ years</span>
                    <span className="pill-lbl">Farming Experience</span>
                  </div>
                </div>
                <button className="identity-pill edit-profile-pill" onClick={handleOpenEditModal}>
                  <Edit3 size={14} className="pill-icon" />
                  <span>Edit Profile</span>
                </button>
              </div>
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
              <div className="stat-val">3</div>
              <div className="stat-lbl">Fields</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon-row">
                <Maximize size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">12.45</div>
              <div className="stat-lbl">Acres</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon-row">
                <Leaf size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">3</div>
              <div className="stat-lbl">Crops</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon-row">
                <Sparkles size={18} className="stat-icon text-success" />
              </div>
              <div className="stat-val">6</div>
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
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.875rem' }}>
            No farming history yet. Your crop records will appear here.
          </div>
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
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} strokeWidth={1.5} color="#4B5563" />
                )}
              </div>
              <div>
                <button className="change-photo-btn" onClick={triggerFileInput}>Change Photo</button>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>JPG, GIF or PNG. Max size of 800K</div>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveProfile}>Save Changes</button>
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
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>
                No farming history yet. Your crop records will appear here.
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
