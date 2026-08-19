const fs = require('fs');

const resolvedContent = `import React, { useState, useEffect } from "react";
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

// Animated Hover Components
import TriangleAlertIcon from "../components/hover-ui/triangle-alert-icon";
import InfoCircleIcon from "../components/hover-ui/info-circle-icon";
import CheckedIcon from "../components/hover-ui/checked-icon";
import DownChevron from "../components/hover-ui/down-chevron";
import ArrowNarrowLeftIcon from "../components/hover-ui/arrow-narrow-left-icon";
import ArrowNarrowRightIcon from "../components/hover-ui/arrow-narrow-right-icon";

import "./Alerts.css";

const AlertsStatCard = ({ type, title, value, desc, icon: IconComponent }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className={\`alerts-stat-card \${type}\`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="alerts-stat-header">
        <div className={\`alerts-stat-icon \${type}\`}>
          <IconComponent size={16} strokeWidth={2.5} isHovered={isHovered} />
        </div>
        <span className={\`alerts-stat-title \${type}\`}>{title}</span>
      </div>
      <h3 className="alerts-stat-value">{value}</h3>
      <p className="alerts-stat-desc">{desc}</p>
    </div>
  );
};

const AlertsListItem = ({ alert, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className={\`alerts-item \${alert.resolved ? 'resolved' : ''}\`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="alerts-item-main">
        <div className={\`alerts-item-icon \${
          alert.resolved ? 'resolved' :
          alert.priority === 'High' ? 'high' :
          alert.priority === 'Medium' ? 'medium' : 'info'
        }\`}>
          {alert.resolved ? <CheckedIcon size={20} isHovered={isHovered} /> :
           alert.priority === 'High' || alert.priority === 'Medium' ? <TriangleAlertIcon size={20} isHovered={isHovered} /> :
           <InfoCircleIcon size={20} isHovered={isHovered} />}
        </div>
        <div>
          <h4 className={\`alerts-item-title \${alert.resolved ? 'resolved' : 'active'}\`}>
            {alert.title}
          </h4>
          <p className="alerts-item-desc">{alert.description}</p>
          {!alert.resolved && (
            <button className="alerts-item-link" onClick={() => navigate('/fields')}>
              View Details <ArrowNarrowRightIcon size={12} isHovered={isHovered} />
            </button>
          )}
        </div>
      </div>
      <div className="alerts-item-col">
        <span className={\`alerts-badge \${
          alert.field === 'All Fields' ? 'all' : 'success'
        }\`}>
          {alert.field}
        </span>
      </div>
      <div className="alerts-item-col">
        <span className={\`alerts-badge \${
          alert.resolved ? 'success' :
          alert.priority === 'High' ? 'danger' :
          alert.priority === 'Medium' ? 'warning' : 'info'
        }\`}>
          {alert.resolved ? 'Resolved' : alert.priority}
        </span>
      </div>
      <div className="alerts-item-time-col">
        <span className="alerts-item-time">{alert.time}</span>
        <button className="alerts-item-more"><MoreVertical size={18} /></button>
      </div>
    </div>
  );
};

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
        setAlerts(data || []);
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

  const highCount = alerts.filter(a => a.priority === "High" && !a.resolved).length;
  const mediumCount = alerts.filter(a => a.priority === "Medium" && !a.resolved).length;
  const lowCount = alerts.filter(a => (a.priority === "Low" || a.priority === "Info") && !a.resolved).length;
  const resolvedCount = alerts.filter(a => a.resolved || a.priority === "Resolved").length;
  const unreadCount = alerts.filter(a => !a.resolved).length;
  const totalCount = alerts.length || 1; 
  
  const highPct = totalCount > 0 ? Math.round((highCount / totalCount) * 100) : 0;
  const mediumPct = totalCount > 0 ? Math.round((mediumCount / totalCount) * 100) : 0;
  const lowPct = totalCount > 0 ? Math.round((lowCount / totalCount) * 100) : 0;
  const resolvedPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

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
                className={\`alerts-dropdown-item \${selectedField === field ? 'selected' : ''}\`}
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
          <CheckedIcon size={16} className="text-text-muted" /> Mark all as read
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
              <DownChevron size={14} />
            </button>
            
            <div className="dashboard-header-profile" onClick={() => navigate('/profile')}>
              <div className="dashboard-header-avatar">
                <User size={14} />
              </div>
              <span className="dashboard-header-action profile-name">
                Ramesh <DownChevron size={14} />
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
          <div className="alerts-stats-grid">
            <AlertsStatCard 
              type="danger" 
              title="High Priority" 
              value={isLoading ? "-" : highCount} 
              desc="Needs immediate action" 
              icon={TriangleAlertIcon} 
            />

            <AlertsStatCard 
              type="warning" 
              title="Medium Priority" 
              value={isLoading ? "-" : mediumCount} 
              desc="Needs attention" 
              icon={TriangleAlertIcon} 
            />

            <AlertsStatCard 
              type="info" 
              title="Low Priority" 
              value={isLoading ? "-" : lowCount} 
              desc="For your information" 
              icon={InfoCircleIcon} 
            />

            <AlertsStatCard 
              type="success" 
              title="Resolved" 
              value={isLoading ? "-" : resolvedCount} 
              desc="Last 7 days" 
              icon={CheckedIcon} 
            />
          </div>

          {/* List Area */}
          <div className="alerts-list-card">
            
            {/* Tabs */}
            <div className="alerts-tabs">
              {['All Alerts', 'Unread', 'High', 'Medium', 'Low', 'Resolved'].map((tab) => {
                const label = tab === 'Unread' ? \`Unread (\${unreadCount})\` :
                              tab === 'High' ? \`High (\${highCount})\` :
                              tab === 'Medium' ? \`Medium (\${mediumCount})\` :
                              tab === 'Low' ? \`Low (\${lowCount})\` :
                              tab === 'Resolved' ? \`Resolved (\${resolvedCount})\` : \`All Alerts (\${totalCount})\`;
                return (
                  <button 
                    key={tab} 
                    className={\`alerts-tab \${activeTab === tab ? 'active' : 'inactive'}\`}
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
              ) : filteredAlerts.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}>
                  <TriangleAlertIcon size={32} style={{ margin: "0 auto 12px auto", color: "#9CA3AF" }} />
                  <p style={{ fontWeight: 500, fontSize: "14px" }}>No alerts found</p>
                  <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>Everything is running smoothly on your fields.</p>
                </div>
              ) : filteredAlerts.map((alert) => (
                <AlertsListItem key={alert.id} alert={alert} navigate={navigate} />
              ))}

            </div>

            {/* Pagination Footer */}
            <div className="alerts-pagination">
              <span className="alerts-pagination-info">Showing 1 to {Math.min(filteredAlerts.length, 5)} of {filteredAlerts.length} alerts</span>
              <div className="alerts-pagination-controls">
                <button className="alerts-page-btn icon"><ArrowNarrowLeftIcon size={16} /></button>
                <button className="alerts-page-btn active">1</button>
                <button className="alerts-page-btn icon"><ArrowNarrowRightIcon size={16} /></button>
              </div>
            </div>

          </div>

          {/* Footer Info Banner */}
          <div className="alerts-footer-banner">
            <div className="alerts-footer-text">
              <InfoCircleIcon size={18} className="shrink-0 mt-0.5 text-info" />
              <p className="alerts-footer-desc">Alerts are generated based on AI analysis and real-time data. Always verify conditions in your field.</p>
            </div>
            <div className="alerts-footer-link-container">
              Need help? Contact <Link to="/ask" className="alerts-footer-link">Ask AgriMesh</Link>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="alerts-sidebar">
          
          {/* Chart at the top of Sidebar */}
          <div className="alerts-summary-card">
            <h3 className="alerts-sidebar-title">Alerts Summary</h3>
            
            <div className="alerts-chart-container">
              <div className="alerts-chart-wrapper">
                {/* SVG Donut Chart */}
                <svg viewBox="0 0 36 36" className="alerts-chart-svg">
                  {totalCount === 0 ? (
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E5E7EB" strokeWidth="4" strokeDasharray="100 0"></circle>
                  ) : (
                    <>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray={\`\${highPct} \${100 - highPct}\`} strokeDashoffset="25"></circle>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={\`\${mediumPct} \${100 - mediumPct}\`} strokeDashoffset={\`\${25 - highPct}\`}></circle>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray={\`\${lowPct} \${100 - lowPct}\`} strokeDashoffset={\`\${25 - highPct - mediumPct}\`}></circle>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray={\`\${resolvedPct} \${100 - resolvedPct}\`} strokeDashoffset={\`\${25 - highPct - mediumPct - lowPct}\`}></circle>
                    </>
                  )}
                </svg>
                <div className="alerts-chart-center">
                  <span className="alerts-chart-total">{isLoading ? "-" : totalCount}</span>
                  <span className="alerts-chart-label">Total</span>
                </div>
              </div>

              <div className="alerts-legend">
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot danger"></div><span className="alerts-legend-text">High</span></div><span className="alerts-legend-value">{highCount} ({highPct}%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot warning"></div><span className="alerts-legend-text">Medium</span></div><span className="alerts-legend-value">{mediumCount} ({mediumPct}%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot info"></div><span className="alerts-legend-text">Low</span></div><span className="alerts-legend-value">{lowCount} ({lowPct}%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot success"></div><span className="alerts-legend-text">Resolved</span></div><span className="alerts-legend-value">{resolvedCount} ({resolvedPct}%)</span></div>
              </div>
            </div>

            <button className="alerts-sidebar-btn">
              View Alert Analytics <ArrowNarrowRightIcon size={14} />
            </button>
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
                      <div className={\`alerts-action-icon \${iconClass}\`}>
                        <IconComponent size={18} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div className="alerts-action-title">{actionPrefix} {alert.field !== 'All Fields' ? alert.field : 'Fields'}</div>
                        <div className="alerts-action-desc">{alert.title}</div>
                      </div>
                    </div>
                    <ArrowNarrowRightIcon size={16} className="alerts-action-chevron" />
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
                View All Recommendations <ArrowNarrowRightIcon size={14} />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
`;
fs.writeFileSync('client/src/pages/Alerts.jsx', resolvedContent);
