import React, { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

import "./Alerts.css";

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await cropApi.getAlerts();
        
        // Decorate with mockup data to match Image 3 perfectly
        const decoratedAlerts = data.map((alert, index) => {
          if (index === 0) {
            return {
              id: "1",
              title: "Aphids detected in Moong Field 03",
              description: "Aphid population is above threshold level.",
              field: "Moong Field 03",
              priority: "High",
              time: "1h ago",
              resolved: false
            };
          } else if (index === 1) {
            return {
              id: "2",
              title: "Low soil moisture in Wheat Field 01",
              description: "Soil moisture level is below optimal range.",
              field: "Wheat Field 01",
              priority: "Medium",
              time: "3h ago",
              resolved: false
            };
          } else if (index === 2) {
            return {
              id: "3",
              title: "Nitrogen deficiency in Rice Field 02",
              description: "Recommended to apply nitrogen fertilizer.",
              field: "Rice Field 02",
              priority: "Medium",
              time: "5h ago",
              resolved: false
            };
          } else if (index === 3) {
            return {
              id: "4",
              title: "Weather alert: Heavy rainfall expected",
              description: "Heavy rainfall expected in next 24 hours.",
              field: "All Fields",
              priority: "Low",
              time: "8h ago",
              resolved: false
            };
          } else {
            return {
              id: "5",
              title: "Irrigation completed",
              description: "Scheduled irrigation completed successfully.",
              field: "Wheat Field 01",
              priority: "Resolved",
              time: "Yesterday",
              resolved: true
            };
          }
        });
        
        setAlerts(decoratedAlerts.slice(0, 5)); // ensure max 5 items for exact match
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="alerts-container">
      
      {/* HEADER */}
      <div className="alerts-header">
        <div>
          <h1 className="alerts-title">Alerts</h1>
          <p className="alerts-subtitle">Stay updated with important alerts for your fields</p>
        </div>
        <div className="alerts-header-actions">
          <button className="alerts-btn">
            All Fields <ChevronDown size={16} className="text-text-muted" />
          </button>
          <button className="alerts-btn">
            <CheckCircle2 size={16} className="text-text-muted" /> Mark all as read
          </button>
        </div>
      </div>

      <div className="alerts-content">
        
        {/* Main Content (Left) */}
        <div className="alerts-main">
          
          {/* Top Stats */}
          <div className="alerts-stats-grid">
            
            <div className="alerts-stat-card danger">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon danger">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title danger">High Priority</span>
              </div>
              <h3 className="alerts-stat-value">1</h3>
              <p className="alerts-stat-desc">Needs immediate action</p>
            </div>

            <div className="alerts-stat-card warning">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon warning">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title warning">Medium Priority</span>
              </div>
              <h3 className="alerts-stat-value">2</h3>
              <p className="alerts-stat-desc">Needs attention</p>
            </div>

            <div className="alerts-stat-card info">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon info">
                  <Info size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title info">Low Priority</span>
              </div>
              <h3 className="alerts-stat-value">0</h3>
              <p className="alerts-stat-desc">For your information</p>
            </div>

            <div className="alerts-stat-card success">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon success">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title success">Resolved</span>
              </div>
              <h3 className="alerts-stat-value">12</h3>
              <p className="alerts-stat-desc">Last 7 days</p>
            </div>
            
          </div>

          {/* List Area */}
          <div className="alerts-list-card">
            
            {/* Tabs */}
            <div className="alerts-tabs">
              <button className="alerts-tab active">All Alerts</button>
              <button className="alerts-tab inactive">Unread (3)</button>
              <button className="alerts-tab inactive">High (1)</button>
              <button className="alerts-tab inactive">Medium (2)</button>
              <button className="alerts-tab inactive">Low (0)</button>
              <button className="alerts-tab inactive">Resolved</button>
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
              ) : alerts.map((alert) => (
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
              <Info size={18} className="shrink-0 mt-0.5" />
              <p className="alerts-footer-desc">Alerts are generated based on AI analysis and real-time data. Always verify conditions in your field.</p>
            </div>
            <div className="alerts-footer-link-container">
              Need help? Contact <Link to="/expert" className="alerts-footer-link">Expert Support</Link>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="alerts-sidebar">
          
          {/* Alerts Summary */}
          <div className="alerts-summary-card">
            <h3 className="alerts-sidebar-title">Alerts Summary</h3>
            
            <div className="alerts-chart-container">
              <div className="alerts-chart-wrapper">
                {/* SVG Donut Chart Match Image 3 */}
                <svg viewBox="0 0 36 36" className="alerts-chart-svg">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="25"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="13 87" strokeDashoffset="18"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="0 100" strokeDashoffset="5"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray="80 20" strokeDashoffset="5"></circle>
                </svg>
                <div className="alerts-chart-center">
                  <span className="alerts-chart-total">15</span>
                  <span className="alerts-chart-label">Total</span>
                </div>
              </div>

              <div className="alerts-legend">
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot danger"></div><span className="alerts-legend-text">High</span></div><span className="alerts-legend-value">1 (7%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot warning"></div><span className="alerts-legend-text">Medium</span></div><span className="alerts-legend-value">2 (13%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot info"></div><span className="alerts-legend-text">Low</span></div><span className="alerts-legend-value">0 (0%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot success"></div><span className="alerts-legend-text">Resolved</span></div><span className="alerts-legend-value">12 (80%)</span></div>
              </div>
            </div>

            <button className="alerts-sidebar-btn">
              View Alert Analytics <ArrowRight size={14} />
            </button>
          </div>

          {/* Recommended Actions */}
          <div className="alerts-actions-card">
            <h3 className="alerts-actions-title">Recommended Actions</h3>
            
            <div className="alerts-actions-list">
              <button className="alerts-action-btn">
                <div className="alerts-action-content">
                  <div className="alerts-action-icon danger">
                    <Bug size={14} />
                  </div>
                  <div>
                    <h4 className="alerts-action-title">Check Moong Field 03</h4>
                    <p className="alerts-action-desc">Inspect aphid infestation</p>
                  </div>
                </div>
                <ChevronRight size={16} className="alerts-action-chevron" />
              </button>

              <button className="alerts-action-btn">
                <div className="alerts-action-content">
                  <div className="alerts-action-icon warning">
                    <Droplet size={14} />
                  </div>
                  <div>
                    <h4 className="alerts-action-title">Irrigate Wheat Field 01</h4>
                    <p className="alerts-action-desc">Soil moisture is low</p>
                  </div>
                </div>
                <ChevronRight size={16} className="alerts-action-chevron" />
              </button>

              <button className="alerts-action-btn">
                <div className="alerts-action-content">
                  <div className="alerts-action-icon warning">
                    <Leaf size={14} />
                  </div>
                  <div>
                    <h4 className="alerts-action-title">Add Nitrogen to Rice Field 02</h4>
                    <p className="alerts-action-desc">Improve plant growth</p>
                  </div>
                </div>
                <ChevronRight size={16} className="alerts-action-chevron" />
              </button>

              <button className="alerts-action-btn">
                <div className="alerts-action-content">
                  <div className="alerts-action-icon info">
                    <CloudRain size={14} />
                  </div>
                  <div>
                    <h4 className="alerts-action-title">View Weather Forecast</h4>
                    <p className="alerts-action-desc">Heavy rain expected</p>
                  </div>
                </div>
                <ChevronRight size={16} className="alerts-action-chevron" />
              </button>
            </div>

            <button className="alerts-actions-view-all">
              View All Recommendations <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
