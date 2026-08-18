import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronDown, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Bug,
  Droplet,
  Leaf,
  CloudRain,
  ArrowRight,
  Loader2,
  Globe,
  User
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Alerts.css";

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedField, setSelectedField] = useState("All Fields");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Alerts');
  const navigate = useNavigate();
  const [portalTarget, setPortalTarget] = useState(null);

  const [tooltip, setTooltip] = useState(null);

  const handleChartEnter = (e, label, color, dasharray, dashoffset) => {
    e.target.setAttribute('stroke-width', '6');
    const length = parseFloat(dasharray.split(' ')[0]);
    const offset = parseFloat(dashoffset);
    const start = 100 - offset;
    const midpoint = (start + length / 2) % 100;
    const angleDeg = (midpoint / 100) * 360 - 90;
    const angleRad = angleDeg * (Math.PI / 180);

    const distance = 80;
    const x = 48 + distance * Math.cos(angleRad);
    const y = 48 + distance * Math.sin(angleRad);

    setTooltip({ label, color, x, y });
  };

  const handleChartLeave = (e) => {
    e.target.setAttribute('stroke-width', '4');
    setTooltip(null);
  };

  useEffect(() => {
    setPortalTarget(document.getElementById('alerts-header-portal'));
  }, []);

  const fields = ["All Fields", ...new Set(alerts.map(a => a.field).filter(f => f && f !== 'All Fields'))];

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await cropApi.getAlerts();
        if (data && data.length > 0) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  let filteredAlerts = selectedField === "All Fields" 
    ? alerts 
    : alerts.filter(a => a.field === selectedField);

  if (activeTab === 'Unread') {
    filteredAlerts = filteredAlerts.filter(a => !a.resolved);
  } else if (activeTab === 'High') {
    filteredAlerts = filteredAlerts.filter(a => a.priority === 'High');
  } else if (activeTab === 'Medium') {
    filteredAlerts = filteredAlerts.filter(a => a.priority === 'Medium');
  } else if (activeTab === 'Low') {
    filteredAlerts = filteredAlerts.filter(a => a.priority === 'Info' || a.priority === 'Low');
  } else if (activeTab === 'Resolved') {
    filteredAlerts = filteredAlerts.filter(a => a.resolved || a.priority === 'Resolved');
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, resolved: true, priority: 'Resolved' })));
  };

  const highCount = alerts.filter(a => a.priority === 'High' && !a.resolved).length;
  const mediumCount = alerts.filter(a => a.priority === 'Medium' && !a.resolved).length;
  const lowCount = alerts.filter(a => (a.priority === 'Low' || a.priority === 'Info') && !a.resolved).length;
  const resolvedCount = alerts.filter(a => a.resolved || a.priority === 'Resolved').length;
  const unreadCount = alerts.filter(a => !a.resolved).length;
  const totalCount = alerts.length || 1; 
  
  const highPct = (highCount / totalCount) * 100;
  const mediumPct = (mediumCount / totalCount) * 100;
  const lowPct = (lowCount / totalCount) * 100;
  const resolvedPct = (resolvedCount / totalCount) * 100;

  const highOffset = 25;
  const mediumOffset = (highOffset - highPct + 100) % 100;
  const lowOffset = (mediumOffset - mediumPct + 100) % 100;
  const resolvedOffset = (lowOffset - lowPct + 100) % 100;

  const filterControls = (
    <>
      <div className="alerts-header-actions" style={{ position: 'relative' }}>
        <button className="alerts-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          {selectedField} <ChevronDown size={16} className="text-text-muted" />
        </button>
        
        {isDropdownOpen && (
          <div className="alerts-dropdown-menu">
            {fields.map(field => (
              <button 
                key={field} 
                className={`alerts-dropdown-item ${selectedField === field ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedField(field);
                  setIsDropdownOpen(false);
                }}
              >
                {field}
              </button>
            ))}
          </div>
        )}

        <button className="alerts-btn" onClick={markAllAsRead}>
          <CheckCircle2 size={16} className="text-text-muted" /> Mark all as read
        </button>
      </div>
    </>
  );

  return (
    <div className="alerts-container">
      
      {/* HEADER PORTAL */}
      {portalTarget && createPortal(
        <>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="alerts-title" style={{ margin: 0, fontSize: '1.5rem', lineHeight: '2rem' }}>Alerts</h1>
          </div>
          <div className="dashboard-header-actions alerts-header-right" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            
            <div className="alerts-header-filters-desktop">
              {filterControls}
            </div>
            
            <button className="dashboard-header-action language" onClick={() => {}}>
              <Globe size={16} />
              <span className="lang-full">English</span>
              <span className="lang-short">En</span>
              <ChevronDown size={14} />
            </button>
            
            <div className="dashboard-header-profile" onClick={() => navigate('/profile')}>
              <div className="dashboard-header-avatar">
                <User size={14} />
              </div>
              <span className="dashboard-header-action profile-name">
                Ramesh <ChevronDown size={14} />
              </span>
            </div>
          </div>
        </>,
        portalTarget
      )}

      <div className="alerts-content">
        
        {/* Main Content (Left) */}
        <div className="alerts-main">
          
          <div className="alerts-header-filters-mobile">
            {filterControls}
          </div>

          {/* Top Stats */}
          <div className="alerts-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="alerts-stat-box danger">
              <div className="alerts-stat-box-header">
                <div className="alerts-stat-icon-tiny danger">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-box-title danger">High Priority</span>
              </div>
              <span className="alerts-stat-box-value">{highCount}</span>
            </div>

            <div className="alerts-stat-box warning">
              <div className="alerts-stat-box-header">
                <div className="alerts-stat-icon-tiny warning">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-box-title warning">Medium Priority</span>
              </div>
              <span className="alerts-stat-box-value">{mediumCount}</span>
            </div>

            <div className="alerts-stat-box info">
              <div className="alerts-stat-box-header">
                <div className="alerts-stat-icon-tiny info">
                  <Info size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-box-title info">Low Priority</span>
              </div>
              <span className="alerts-stat-box-value">{lowCount}</span>
            </div>

            <div className="alerts-stat-box success">
              <div className="alerts-stat-box-header">
                <div className="alerts-stat-icon-tiny success">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-box-title success">Resolved</span>
              </div>
              <span className="alerts-stat-box-value">{resolvedCount}</span>
            </div>
          </div>

          {/* List Area */}
          <div className="alerts-list-card">
            
            {/* Tabs */}
            <div className="alerts-tabs">
              {['All Alerts', 'Unread', 'High', 'Medium', 'Low', 'Resolved'].map((tab) => {
                const label = tab === 'Unread' ? `Unread (${unreadCount})` :
                              tab === 'High' ? `High (${highCount})` :
                              tab === 'Medium' ? `Medium (${mediumCount})` :
                              tab === 'Low' ? `Low (${lowCount})` :
                              tab === 'Resolved' ? `Resolved (${resolvedCount})` : tab;
                return (
                  <button 
                    key={tab} 
                    className={`alerts-tab ${activeTab === tab ? 'active' : 'inactive'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Table Header */}
            <div className="alerts-table-header">
              <div className="alerts-th alerts-th-main">Alert</div>
              <div className="alerts-th alerts-th-hidden">Field</div>
              <div className="alerts-th alerts-th-hidden">Priority</div>
              <div className="alerts-th alerts-th-right">Time</div>
            </div>

            {/* List Items */}
            <div className="alerts-list">
              
              {isLoading ? (
                <div className="alerts-loader">
                  <Loader2 className="alerts-spinner" />
                </div>
              ) : filteredAlerts.map((alert) => (
                <div key={alert.id} className={`alerts-item ${alert.resolved ? 'resolved' : ''}`}>
                  <div className="alerts-item-main">
                    <div className={`alerts-item-icon ${
                      alert.resolved ? 'resolved' :
                      alert.priority === 'High' ? 'high' :
                      alert.priority === 'Medium' ? 'medium' : 'info'
                    }`}>
                      {alert.resolved ? <CheckCircle2 size={20} /> :
                       alert.priority === 'High' || alert.priority === 'Medium' ? <AlertTriangle size={20} /> :
                       <Info size={20} />}
                    </div>
                    <div>
                      <h4 className={`alerts-item-title ${alert.resolved ? 'resolved' : 'active'}`}>
                        {alert.title}
                      </h4>
                      <p className="alerts-item-desc">{alert.description}</p>
                      {!alert.resolved && (
                        <button className="alerts-item-link" onClick={() => navigate('/fields')}>
                          View Details <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="alerts-item-col">
                    <span className={`alerts-badge ${
                      alert.field === 'All Fields' ? 'all' : 'success'
                    }`}>
                      {alert.field}
                    </span>
                  </div>
                  <div className="alerts-item-col">
                    <span className={`alerts-badge ${
                      alert.resolved ? 'success' :
                      alert.priority === 'High' ? 'danger' :
                      alert.priority === 'Medium' ? 'warning' : 'info'
                    }`}>
                      {alert.resolved ? 'Resolved' : alert.priority}
                    </span>
                  </div>

                  <div className="alerts-item-time-col">
                    <span className="alerts-item-time">{alert.time}</span>
                    <button className="alerts-item-more"><MoreVertical size={18} /></button>
                  </div>
                </div>
              ))}

            </div>

            {/* Pagination Footer */}
            <div className="alerts-pagination">
              <span className="alerts-pagination-info">Showing 1 to 5 of 15 alerts</span>
              <div className="alerts-pagination-controls">
                <button className="alerts-page-btn icon"><ChevronLeft size={16} /></button>
                <button className="alerts-page-btn active">1</button>
                <button className="alerts-page-btn inactive">2</button>
                <button className="alerts-page-btn inactive">3</button>
                <button className="alerts-page-btn icon"><ChevronRight size={16} /></button>
              </div>
            </div>

          </div>

          {/* Footer Info Banner */}
          <div className="alerts-footer-banner">
            <div className="alerts-footer-text">
              <Info size={16} className="text-info" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p className="alerts-footer-desc">
                  Alerts are generated based on AI analysis and real-time data. Always verify conditions in your field.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="alerts-sidebar">
          
          {/* Chart at the top of Sidebar */}
          <div className="alerts-chart-card" style={{ backgroundColor: 'var(--surface)', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', width: '100%', textAlign: 'left' }}>Alerts Summary</h3>
            <div className="alerts-chart-wrapper-small" style={{ width: '6rem', height: '6rem' }}>
              <svg viewBox="0 0 36 36" className="alerts-chart-svg">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray={`${highPct} ${100 - highPct}`} strokeDashoffset={`${highOffset}`} style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }} onMouseEnter={(e) => handleChartEnter(e, 'High Priority', '#ef4444', `${highPct} ${100 - highPct}`, `${highOffset}`)} onMouseLeave={handleChartLeave} />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${mediumPct} ${100 - mediumPct}`} strokeDashoffset={`${mediumOffset}`} style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }} onMouseEnter={(e) => handleChartEnter(e, 'Medium Priority', '#f59e0b', `${mediumPct} ${100 - mediumPct}`, `${mediumOffset}`)} onMouseLeave={handleChartLeave} />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${lowPct} ${100 - lowPct}`} strokeDashoffset={`${lowOffset}`} style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }} onMouseEnter={(e) => handleChartEnter(e, 'Low Priority', '#3b82f6', `${lowPct} ${100 - lowPct}`, `${lowOffset}`)} onMouseLeave={handleChartLeave} />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${resolvedPct} ${100 - resolvedPct}`} strokeDashoffset={`${resolvedOffset}`} style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }} onMouseEnter={(e) => handleChartEnter(e, 'Resolved', '#22c55e', `${resolvedPct} ${100 - resolvedPct}`, `${resolvedOffset}`)} onMouseLeave={handleChartLeave} />
              </svg>
              <div className="alerts-chart-center-small" style={{ flexDirection: 'column', pointerEvents: 'none' }}>
                <span className="alerts-chart-total-small" style={{ fontSize: '1.5rem', lineHeight: '1' }}>{alerts.length}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', marginTop: '0.25rem' }}>ALERTS</span>
              </div>
              
              {tooltip && (
                <div 
                  className="alerts-chart-tooltip" 
                  style={{ 
                    left: `${tooltip.x}px`, 
                    top: `${tooltip.y}px`, 
                    transform: 'translate(-50%, -50%)' 
                  }}
                >
                  <div className="alerts-tooltip-dot" style={{ backgroundColor: tooltip.color }}></div>
                  {tooltip.label}
                </div>
              )}
            </div>
          </div>



          {/* Recommended Actions */}
          <div className="alerts-actions-card" style={{ marginTop: '1.5rem' }}>
            <h3 className="alerts-actions-title">Recommended Actions</h3>
            
            <div className="alerts-actions-list">
              {filteredAlerts.filter(a => !a.resolved).slice(0, 3).map((alert) => {
                let iconClass = 'info';
                let IconComponent = Info;
                let actionPrefix = 'Check';
                let titleLower = alert.title ? alert.title.toLowerCase() : '';

                if (titleLower.includes('pest') || titleLower.includes('aphid')) {
                  iconClass = 'danger';
                  IconComponent = Bug;
                  actionPrefix = 'Inspect';
                } else if (titleLower.includes('water') || titleLower.includes('moist') || titleLower.includes('irriga')) {
                  iconClass = 'warning';
                  IconComponent = Droplet;
                  actionPrefix = 'Irrigate';
                } else if (titleLower.includes('nutrient') || titleLower.includes('nitrogen') || titleLower.includes('fertil')) {
                  iconClass = 'success';
                  IconComponent = Leaf;
                  actionPrefix = 'Fertilize';
                } else if (titleLower.includes('rain') || titleLower.includes('weather') || titleLower.includes('storm')) {
                  iconClass = 'info';
                  IconComponent = CloudRain;
                  actionPrefix = 'Monitor';
                } else if (alert.priority === 'High') {
                   iconClass = 'danger';
                   IconComponent = AlertTriangle;
                } else if (alert.priority === 'Medium') {
                   iconClass = 'warning';
                   IconComponent = AlertTriangle;
                }

                return (
                  <button key={alert.id} className="alerts-action-btn">
                    <div className="alerts-action-content">
                      <div className={`alerts-action-icon ${iconClass}`}>
                        <IconComponent size={18} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div className="alerts-action-title">{actionPrefix} {alert.field !== 'All Fields' ? alert.field : 'Fields'}</div>
                        <div className="alerts-action-desc">{alert.title}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="alerts-action-chevron" />
                  </button>
                );
              })}

              {filteredAlerts.filter(a => !a.resolved).length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No recommended actions at this time.
                </div>
              )}
            </div>
            
            {filteredAlerts.filter(a => !a.resolved).length > 0 && (
              <button className="alerts-actions-view-all">
                View All Recommendations <ArrowRight size={16} />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
