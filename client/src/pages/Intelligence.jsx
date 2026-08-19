import React, { useState, useEffect } from "react";
import { 
  Leaf, 
  TrendingUp, 
  AlertTriangle, 
  ClipboardList, 
  Info,
  Droplet,
  Bug,
  Sun,
  Loader2
} from "lucide-react";
import { cropApi } from "../features/crop-context/api/cropApi";



import "./Intelligence.css";


export const Intelligence = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        const result = await cropApi.getIntelligence();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch intelligence data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIntelligence();
  }, []);

  return (
    <div className="intelligence-container">
      
      {/* HEADER */}
      <div className="intelligence-header">
        <div>
          <h1 className="intelligence-title">Intelligence Dashboard</h1>
          <p className="intelligence-subtitle">AI-powered insights and recommendations for your fields</p>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="intelligence-stats-grid">
        
        <div className="intelligence-stat-card">
          <div className="intelligence-stat-icon-wrapper success">
            <Leaf size={24} />
          </div>
          <div>
            <p className="intelligence-stat-label">Total Fields</p>
            <h3 className="intelligence-stat-value">{isLoading ? "-" : data?.stats?.totalFields}</h3>
            <p className="intelligence-stat-desc">Active fields</p>
          </div>
        </div>

        <div className="intelligence-stat-card">
          <div className="intelligence-stat-icon-wrapper info">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="intelligence-stat-label">Avg. Field Health</p>
            <h3 className="intelligence-stat-value">{isLoading ? "-" : `${data?.stats?.avgHealth}%`}</h3>
            <p className="intelligence-stat-desc">Good</p>
          </div>
        </div>

        <div className="intelligence-stat-card">
          <div className="intelligence-stat-icon-wrapper warning">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="intelligence-stat-label">Active Alerts</p>
            <h3 className="intelligence-stat-value">{isLoading ? "-" : data?.stats?.activeAlerts}</h3>
            <p className="intelligence-stat-desc">Needs attention</p>
          </div>
        </div>

        <div className="intelligence-stat-card">
          <div className="intelligence-stat-icon-wrapper purple">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="intelligence-stat-label">Recommendations</p>
            <h3 className="intelligence-stat-value">{isLoading ? "-" : data?.stats?.recommendations}</h3>
            <p className="intelligence-stat-desc">This week</p>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="intelligence-charts-grid">
        
        {/* Field Health Overview (Donut Chart placeholder) */}
        <div className="intelligence-widget-card">
          <div className="intelligence-widget-header">
            <h3 className="intelligence-widget-title">Field Health Overview</h3>
            <Info size={16} className="text-text-muted" />
          </div>
          
          <div className="intelligence-donut-area">
            <div className="intelligence-donut-wrapper">
              {isLoading ? (
                <div className="intelligence-donut-spinner-wrapper">
                  <Loader2 size={32} className="intelligence-donut-spinner" />
                </div>
              ) : (
                <>
                  <svg viewBox="0 0 36 36" className="intelligence-donut-svg">
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray={`${data?.healthDistribution?.poor || 0} ${100 - (data?.healthDistribution?.poor || 0)}`} strokeDashoffset="0"></circle>
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${data?.healthDistribution?.moderate || 0} ${100 - (data?.healthDistribution?.moderate || 0)}`} strokeDashoffset={`-${data?.healthDistribution?.poor || 0}`}></circle>
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${data?.healthDistribution?.good || 0} ${100 - (data?.healthDistribution?.good || 0)}`} strokeDashoffset={`-${(data?.healthDistribution?.poor || 0) + (data?.healthDistribution?.moderate || 0)}`}></circle>
                  </svg>
                  <div className="intelligence-donut-center">
                    <span className="intelligence-donut-value">{data?.stats?.avgHealth}%</span>
                    <span className="intelligence-donut-label">Avg. Health</span>
                  </div>
                </>
              )}
            </div>

            <div className="intelligence-legend">
              <div className="intelligence-legend-item"><div className="intelligence-legend-label-group"><div className="intelligence-legend-dot success"></div><span className="intelligence-stat-label">Good</span></div><span className="intelligence-legend-value">{isLoading ? "-" : `${data?.healthDistribution?.good}%`}</span></div>
              <div className="intelligence-legend-item"><div className="intelligence-legend-label-group"><div className="intelligence-legend-dot warning"></div><span className="intelligence-stat-label">Moderate</span></div><span className="intelligence-legend-value">{isLoading ? "-" : `${data?.healthDistribution?.moderate}%`}</span></div>
              <div className="intelligence-legend-item"><div className="intelligence-legend-label-group"><div className="intelligence-legend-dot danger"></div><span className="intelligence-stat-label">Poor</span></div><span className="intelligence-legend-value">{isLoading ? "-" : `${data?.healthDistribution?.poor}%`}</span></div>
            </div>
          </div>

          <button className="intelligence-widget-btn">
            View All Fields
          </button>
        </div>

        {/* Health Trend (Line Chart placeholder) */}
        <div className="intelligence-widget-card span-2">
          <div className="intelligence-widget-header-row">
            <div className="intelligence-widget-header" style={{marginBottom: 0}}>
              <h3 className="intelligence-widget-title">Health Trend</h3>
              <Info size={16} className="text-text-muted" />
            </div>
            <button className="intelligence-filter-btn">
              All Fields <ChevronDown size={16} className="text-text-muted" />
            </button>
          </div>

          <div className="intelligence-trend-area">
            <div className="intelligence-trend-y-axis">
              <div className="intelligence-trend-line"><span className="intelligence-trend-y-label">100%</span></div>
              <div className="intelligence-trend-line"><span className="intelligence-trend-y-label">75%</span></div>
              <div className="intelligence-trend-line"><span className="intelligence-trend-y-label">50%</span></div>
              <div className="intelligence-trend-line"><span className="intelligence-trend-y-label">25%</span></div>
              <div className="intelligence-trend-line bottom"><span className="intelligence-trend-y-label">0%</span></div>
            </div>

            {isLoading ? (
              <div className="intelligence-loader-wrapper">
                <Loader2 size={32} className="intelligence-donut-spinner" />
              </div>
            ) : (
              <div className="intelligence-loader-wrapper" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                Health trend data will appear once satellite observations are available for your fields.
              </div>
            )}

            <div className="intelligence-trend-x-axis">
              <span>Day 1</span><span>Day 2</span><span>Day 3</span><span>Day 4</span><span>Day 5</span><span>Day 6</span><span>Day 7</span>
            </div>
          </div>

          <div className="intelligence-trend-legend">
            <div className="intelligence-widget-header" style={{marginBottom: 0}}>
              <div className="intelligence-trend-legend-line">
                <div className="intelligence-trend-legend-dot"></div>
              </div>
              <span className="intelligence-trend-legend-label">Average Field Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM WIDGETS ROW */}
      <div className="intelligence-bottom-grid">
        
        {/* Top Recommendations */}
        <div className="intelligence-widget-card">
          <div className="intelligence-widget-header">
            <h3 className="intelligence-widget-title">Top Recommendations</h3>
            <Info size={16} className="text-text-muted" />
          </div>

          <div className="intelligence-widget-list">
            {isLoading ? (
              <div className="intelligence-loader-wrapper">
                <Loader2 size={32} className="intelligence-donut-spinner" />
              </div>
            ) : data?.topRecommendations?.map((rec) => (
              <div key={rec.id} className="intelligence-rec-item">
                <div className="intelligence-rec-info">
                  <div className={`intelligence-rec-icon ${
                    rec.type === 'irrigation' ? 'info' : 
                    rec.type === 'nutrient' ? 'success' : 'purple'
                  }`}>
                    {rec.type === 'irrigation' ? <Droplet size={18} fill="currentColor" /> : 
                     rec.type === 'nutrient' ? <Leaf size={18} /> : <Bug size={18} />}
                  </div>
                  <div>
                    <h4 className="intelligence-rec-title">{rec.title}</h4>
                    <p className="intelligence-rec-desc">{rec.desc}</p>
                  </div>
                </div>
                <div className="intelligence-rec-meta">
                  <span className="intelligence-rec-field">{rec.field}</span>
                  <span className={`intelligence-rec-priority ${
                    rec.priority === 'High' ? 'high' : 'medium'
                  }`}>{rec.priority}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="intelligence-widget-btn">
            View All Recommendations
          </button>
        </div>

        {/* Weather Overview */}
        <div className="intelligence-widget-card">
          <div className="intelligence-widget-header-row">
            <div className="intelligence-widget-header" style={{marginBottom: 0}}>
              <h3 className="intelligence-widget-title">Weather Overview</h3>
              <Info size={16} className="text-text-muted" />
            </div>
          </div>

          <div className="intelligence-weather-overview">
            <div className="intelligence-loader-wrapper" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>
              <Sun size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
              <p>Weather data loads from your field's location.</p>
              <p style={{ marginTop: "0.25rem" }}>Add a field with GPS coordinates to see the forecast here.</p>
            </div>
          </div>

          <button className="intelligence-widget-btn">
            View Detailed Forecast
          </button>
        </div>

      </div>
    </div>
  );
};
