import React, { useState, useEffect } from "react";
import { 
  MoreVertical, Bug, Droplet, Leaf, CloudRain, Loader2
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

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await cropApi.getAlerts();
        setAlerts(data || []);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const highPriorityCount = alerts.filter(a => a.priority === "High" && !a.resolved).length;
  const mediumPriorityCount = alerts.filter(a => a.priority === "Medium" && !a.resolved).length;
  const lowPriorityCount = alerts.filter(a => a.priority === "Low" && !a.resolved).length;
  const resolvedCount = alerts.filter(a => a.resolved).length;
  const totalAlerts = alerts.length;

  const highPct = totalAlerts > 0 ? Math.round((highPriorityCount / totalAlerts) * 100) : 0;
  const medPct = totalAlerts > 0 ? Math.round((mediumPriorityCount / totalAlerts) * 100) : 0;
  const lowPct = totalAlerts > 0 ? Math.round((lowPriorityCount / totalAlerts) * 100) : 0;
  const resPct = totalAlerts > 0 ? Math.round((resolvedCount / totalAlerts) * 100) : 0;

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
            All Fields <DownChevron size={16} className="text-text-muted" />
          </button>
          <button className="alerts-btn">
            <CheckedIcon size={16} className="text-text-muted" /> Mark all as read
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
                  <TriangleAlertIcon size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title danger">High Priority</span>
              </div>
              <h3 className="alerts-stat-value">{isLoading ? "-" : highPriorityCount}</h3>
              <p className="alerts-stat-desc">Needs immediate action</p>
            </div>

            <div className="alerts-stat-card warning">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon warning">
                  <TriangleAlertIcon size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title warning">Medium Priority</span>
              </div>
              <h3 className="alerts-stat-value">{isLoading ? "-" : mediumPriorityCount}</h3>
              <p className="alerts-stat-desc">Needs attention</p>
            </div>

            <div className="alerts-stat-card info">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon info">
                  <InfoCircleIcon size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title info">Low Priority</span>
              </div>
              <h3 className="alerts-stat-value">{isLoading ? "-" : lowPriorityCount}</h3>
              <p className="alerts-stat-desc">For your information</p>
            </div>

            <div className="alerts-stat-card success">
              <div className="alerts-stat-header">
                <div className="alerts-stat-icon success">
                  <CheckedIcon size={16} strokeWidth={2.5} />
                </div>
                <span className="alerts-stat-title success">Resolved</span>
              </div>
              <h3 className="alerts-stat-value">{isLoading ? "-" : resolvedCount}</h3>
              <p className="alerts-stat-desc">Last 7 days</p>
            </div>
            
          </div>

          {/* List Area */}
          <div className="alerts-list-card">
            
            {/* Tabs */}
            <div className="alerts-tabs">
              <button className="alerts-tab active">All Alerts ({isLoading ? "-" : totalAlerts})</button>
              <button className="alerts-tab inactive">Unread ({isLoading ? "-" : alerts.filter(a => !a.resolved).length})</button>
              <button className="alerts-tab inactive">High ({isLoading ? "-" : highPriorityCount})</button>
              <button className="alerts-tab inactive">Medium ({isLoading ? "-" : mediumPriorityCount})</button>
              <button className="alerts-tab inactive">Low ({isLoading ? "-" : lowPriorityCount})</button>
              <button className="alerts-tab inactive">Resolved ({isLoading ? "-" : resolvedCount})</button>
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
              ) : alerts.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}>
                  <TriangleAlertIcon size={32} style={{ margin: "0 auto 12px auto", color: "#9CA3AF" }} />
                  <p style={{ fontWeight: 500, fontSize: "14px" }}>No alerts found</p>
                  <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>Everything is running smoothly on your fields.</p>
                </div>
              ) : alerts.map((alert) => (
                <div key={alert.id} className={`alerts-item ${alert.resolved ? 'resolved' : ''}`}>
                  <div className="alerts-item-main">
                    <div className={`alerts-item-icon ${
                      alert.resolved ? 'resolved' :
                      alert.priority === 'High' ? 'high' :
                      alert.priority === 'Medium' ? 'medium' : 'info'
                    }`}>
                      {alert.resolved ? <CheckedIcon size={20} /> :
                       alert.priority === 'High' || alert.priority === 'Medium' ? <TriangleAlertIcon size={20} /> :
                       <InfoCircleIcon size={20} />}
                    </div>
                    <div>
                      <h4 className={`alerts-item-title ${alert.resolved ? 'resolved' : 'active'}`}>
                        {alert.title}
                      </h4>
                      <p className="alerts-item-desc">{alert.description}</p>
                      {!alert.resolved && (
                        <button className="alerts-item-link" onClick={() => navigate('/fields')}>
                          View Details <ArrowNarrowRightIcon size={12} />
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
                <button className="alerts-page-btn icon"><ArrowNarrowLeftIcon size={16} /></button>
                <button className="alerts-page-btn active">1</button>
                <button className="alerts-page-btn inactive">2</button>
                <button className="alerts-page-btn inactive">3</button>
                <button className="alerts-page-btn icon"><ArrowNarrowRightIcon size={16} /></button>
              </div>
            </div>

          </div>

          {/* Footer Info Banner */}
          <div className="alerts-footer-banner">
            <div className="alerts-footer-text">
              <InfoCircleIcon size={18} className="shrink-0 mt-0.5" />
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
                  {totalAlerts === 0 ? (
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E5E7EB" strokeWidth="4" strokeDasharray="100 0"></circle>
                  ) : (
                    <>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray={`${highPct} ${100 - highPct}`} strokeDashoffset="25"></circle>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${medPct} ${100 - medPct}`} strokeDashoffset={`${25 - highPct}`}></circle>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${lowPct} ${100 - lowPct}`} strokeDashoffset={`${25 - highPct - medPct}`}></circle>
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${resPct} ${100 - resPct}`} strokeDashoffset={`${25 - highPct - medPct - lowPct}`}></circle>
                    </>
                  )}
                </svg>
                <div className="alerts-chart-center">
                  <span className="alerts-chart-total">{isLoading ? "-" : totalAlerts}</span>
                  <span className="alerts-chart-label">Total</span>
                </div>
              </div>

              <div className="alerts-legend">
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot danger"></div><span className="alerts-legend-text">High</span></div><span className="alerts-legend-value">{highPriorityCount} ({highPct}%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot warning"></div><span className="alerts-legend-text">Medium</span></div><span className="alerts-legend-value">{mediumPriorityCount} ({medPct}%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot info"></div><span className="alerts-legend-text">Low</span></div><span className="alerts-legend-value">{lowPriorityCount} ({lowPct}%)</span></div>
                <div className="alerts-legend-item"><div className="alerts-legend-label"><div className="alerts-legend-dot success"></div><span className="alerts-legend-text">Resolved</span></div><span className="alerts-legend-value">{resolvedCount} ({resPct}%)</span></div>
              </div>
            </div>

            <button className="alerts-sidebar-btn">
              View Alert Analytics <ArrowNarrowRightIcon size={14} />
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
                <ArrowNarrowRightIcon size={16} className="alerts-action-chevron" />
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
                <ArrowNarrowRightIcon size={16} className="alerts-action-chevron" />
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
                <ArrowNarrowRightIcon size={16} className="alerts-action-chevron" />
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
                <ArrowNarrowRightIcon size={16} className="alerts-action-chevron" />
              </button>
            </div>

            <button className="alerts-actions-view-all">
              View All Recommendations <ArrowNarrowRightIcon size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
