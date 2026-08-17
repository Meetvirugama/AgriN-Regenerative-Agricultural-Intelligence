import React, { useState, useEffect } from "react";
import { 
  Plus, Mic, MoreVertical,
  Droplets, MessageSquare, Bell, Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";

// Animated Hover Components
import Cloud2Icon from "../components/hover-ui/cloud-2-icon";
import TriangleAlertIcon from "../components/hover-ui/triangle-alert-icon";
import InfoCircleIcon from "../components/hover-ui/info-circle-icon";

import "./Home.css";

const HomeAlertItem = ({ alert }) => {
  const [isHovered, setIsHovered] = useState(false);
  const priorityClass = alert.priority === "High" ? "poor" : alert.priority === "Medium" ? "moderate" : "good";
  const iconClass = alert.priority === "High" ? "danger" : alert.priority === "Medium" ? "warning" : "info";
  const IconComponent = alert.priority === "High" || alert.priority === "Medium" ? TriangleAlertIcon : InfoCircleIcon;
  return (
    <div 
      className="home-alert-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="home-alert-content">
        <div className={`home-alert-icon ${iconClass}`}>
          <IconComponent size={20} isHovered={isHovered} />
        </div>
        <div className="home-alert-text">
          <h4>{alert.title}</h4>
          <p>{alert.field || "All Fields"}</p>
        </div>
      </div>
      <div className="home-alert-meta">
        <span className={`home-card-badge ${priorityClass}`} style={{margin: 0}}>{alert.priority}</span>
        <span>{alert.time || "Just now"}</span>
      </div>
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWeatherHovered, setIsWeatherHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fieldsData, alertsData] = await Promise.all([
          cropApi.getAllFields(),
          cropApi.getAlerts()
        ]);
        setFields(fieldsData || []);
        setAlerts(alertsData || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayFields = fields.map(f => ({
    id: f.id,
    name: f.name,
    crop_type: f.crop_type,
    subtitle: f.area_hectares ? `${f.crop_type} • ${f.area_hectares} ha` : `${f.crop_type} • 1.2 ha`,
    status: f.crop_type === 'rice' ? 'Moderate' : 'Good',
    statusClass: f.crop_type === 'rice' ? 'moderate' : 'good',
    img: f.crop_type === 'wheat' ? "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop" 
       : f.crop_type === 'rice' ? "https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop"
       : "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=150&h=150&fit=crop"
  }));

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;
  const fieldsNeedAttentionCount = displayFields.filter(f => f.statusClass !== 'good').length;

  return (
    <div className="home-container">
      <section className="home-header">
        <h1>Good morning, Ramesh</h1>
        <p>Here's what's happening in your fields today.</p>
      </section>

      <div className="home-grid-row-1">
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">My Fields</h2>
            <Link to="/fields" className="home-section-link">View All Fields</Link>
          </div>
          
          <div className="home-fields-grid">
            {isLoading ? (
              <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '48px 0'}}>
                <Loader2 className="animate-spin text-success" size={32} />
              </div>
            ) : (
              <>
                {displayFields.slice(0, 2).map(field => (
                  <div key={field.id} className="home-card">
                    <div className="home-card-top-content">
                      <div className="home-card-info-row">
                        <div className="home-card-image">
                          <img src={field.img} alt={field.crop_type} />
                        </div>
                        <div className="home-card-text-container">
                          <div className="home-card-title-row">
                            <h3 className="home-card-title">{field.name}</h3>
                            <button className="home-card-more-btn"><MoreVertical size={16} /></button>
                          </div>
                          <p className="home-card-subtitle">{field.subtitle}</p>
                        </div>
                      </div>
                      <span className={`home-card-badge ${field.statusClass}`}>
                        {field.status}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate(`/fields/${field.id}`)} 
                      className="home-card-button"
                    >
                      View Field
                    </button>
                  </div>
                ))}

                <div onClick={() => navigate('/fields/add')} className="home-add-field">
                  <Plus size={32} color="#111827" />
                  <span style={{fontWeight: 600, color: '#111827', marginTop: '8px', fontSize: '14px'}}>Add New Field</span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="home-section">
          <h2 className="home-section-title">Today's Recommendation</h2>
          <div 
            className="home-recommendation-card"
            onMouseEnter={() => setIsWeatherHovered(true)}
            onMouseLeave={() => setIsWeatherHovered(false)}
          >
            <div className="home-recommendation-content">
              <Cloud2Icon size={40} className="home-recommendation-icon" strokeWidth={1.5} isHovered={isWeatherHovered} />
              <div className="home-recommendation-text">
                {fields.length > 0 ? (
                  <>
                    <h3>Irrigation scheduling active</h3>
                    <p>Keep track of moisture levels.</p>
                    <div className="subtext">Field: {fields[0].name}</div>
                  </>
                ) : (
                  <>
                    <h3>No fields added yet</h3>
                    <p>Add a field to get crop weather insights.</p>
                    <div className="subtext">Insights ready on field creation</div>
                  </>
                )}
              </div>
            </div>
            <button className="home-recommendation-button" onClick={() => navigate('/intelligence')}>
              View Details
            </button>
          </div>
        </section>
      </div>

      <div className="home-scrollable-section">
        <div className="home-grid-row-2">
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">Recent Alerts</h2>
              <Link to="/alerts" className="home-section-link">View All</Link>
            </div>
            
            <div className="home-alerts-list">
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <Loader2 className="animate-spin text-success" size={24} />
                </div>
              ) : alerts.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#6B7280", fontSize: "13px" }}>
                  No active alerts for your fields.
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <HomeAlertItem key={alert.id} alert={alert} />
                ))
              )}
            </div>
          </section>
        </div>

        <div className="home-grid-row-3">
          <div className="home-stat-card">
            <div className="home-stat-icon success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            </div>
            <div className="home-stat-text">
              <p>Total Fields</p>
              <h3>{isLoading ? "-" : fields.length}</h3>
            </div>
          </div>

          <div className="home-stat-card">
            <div className="home-stat-icon info"><Droplets size={24} /></div>
            <div className="home-stat-text">
              <p>Fields Need Attention</p>
              <h3>{isLoading ? "-" : fieldsNeedAttentionCount}</h3>
            </div>
          </div>

          <div className="home-stat-card">
            <div className="home-stat-icon warning"><Bell size={24} /></div>
            <div className="home-stat-text">
              <p>Active Alerts</p>
              <h3>{isLoading ? "-" : activeAlertsCount}</h3>
            </div>
          </div>

          <div className="home-stat-card">
            <div className="home-stat-icon purple"><MessageSquare size={24} /></div>
            <div className="home-stat-text">
              <p>Expert Responses</p>
              <div className="subtext">This Month</div>
              <h3>0</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
