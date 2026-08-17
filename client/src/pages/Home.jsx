import React, { useState, useEffect } from "react";
import { 
  Plus, CloudRain, AlertTriangle, Mic, MoreVertical,
  Info, Droplets, MessageSquare, Bell, Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cropApi } from "../features/crop-context/api/cropApi";
import "./Home.css";

export const Home = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fieldsData, alertsData] = await Promise.all([
          cropApi.getAllFields(),
          cropApi.getAlerts()
        ]);
        setFields(fieldsData);
        setAlerts(alertsData.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const dummyFields = [
    {
      id: 'dummy1',
      name: 'Wheat Field 01',
      crop_type: 'Wheat',
      subtitle: '1.2 ha • Day 46',
      status: 'Moderate',
      statusClass: 'moderate',
      img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop'
    },
    {
      id: 'dummy2',
      name: 'Rice Field 02',
      crop_type: 'Rice',
      subtitle: '0.8 ha • Day 31',
      status: 'Good',
      statusClass: 'good',
      img: 'https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop'
    }
  ];

  const displayFields = fields.length > 0 ? fields.map(f => ({
    id: f.id,
    name: f.name,
    crop_type: f.crop_type,
    subtitle: `${f.crop_type} • 4.25 acres`,
    status: f.crop_type === 'rice' ? 'Moderate' : 'Good',
    statusClass: f.crop_type === 'rice' ? 'moderate' : 'good',
    img: f.crop_type === 'wheat' ? "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop" 
       : f.crop_type === 'rice' ? "https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop"
       : "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=150&h=150&fit=crop"
  })) : dummyFields;

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
              displayFields.slice(0, 2).map(field => (
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
                    onClick={() => field.id.startsWith('dummy') ? navigate('/fields') : navigate(`/fields/${field.id}`)} 
                    className="home-card-button"
                  >
                    View Field
                  </button>
                </div>
              ))
            )}

            <div onClick={() => navigate('/fields/add')} className="home-add-field">
              <Plus size={32} color="#111827" />
              <span style={{fontWeight: 600, color: '#111827', marginTop: '8px', fontSize: '14px'}}>Add New Field</span>
            </div>
          </div>
        </section>

        <section className="home-section">
          <h2 className="home-section-title">Today's Recommendation</h2>
          <div className="home-recommendation-card">
            <div className="home-recommendation-content">
              <CloudRain size={40} className="home-recommendation-icon" strokeWidth={1.5} />
              <div className="home-recommendation-text">
                <h3>Rain expected in 2 days.</h3>
                <p>Hold irrigation for now.</p>
                <div className="subtext">Field: Wheat Field 01</div>
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
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <div key={alert.id} className="home-alert-item">
                    <div className="home-alert-content">
                      <div className={`home-alert-icon ${alert.priority === 'High' ? 'danger' : alert.priority === 'Medium' ? 'warning' : 'info'}`}>
                        {alert.priority === 'Low' ? <Info size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div className="home-alert-text">
                        <h4>{alert.title}</h4>
                        <p>{alert.field}</p>
                      </div>
                    </div>
                    <div className="home-alert-meta">
                      <span className={`home-card-badge ${alert.priority === 'High' ? 'poor' : alert.priority === 'Medium' ? 'moderate' : 'good'}`} style={{margin: 0}}>
                        {alert.priority}
                      </span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  {isLoading ? 'Loading alerts...' : 'No recent alerts.'}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
