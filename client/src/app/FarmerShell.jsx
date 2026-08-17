import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, Map, BrainCircuit, MessageSquare, Bell, Stethoscope, 
  Users, Settings, User, Search, Sprout, Globe, ChevronDown, 
  Menu, X
} from "lucide-react";
import { GlobalMicButton } from "../features/voice/components/GlobalMicButton";
import { FieldProvider } from "./providers/FieldProvider";
import "./DashboardLayout.css";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "My Fields", path: "/fields", icon: Map },
  { label: "Intelligence", path: "/intelligence", icon: BrainCircuit },
  { label: "Ask AgriMesh", path: "/ask", icon: MessageSquare },
  { label: "Alerts", path: "/alerts", icon: Bell, badge: 3 },
  { label: "Crop Diagnosis", path: "/diagnosis", icon: Stethoscope },
  { label: "Expert Support", path: "/expert", icon: Users },
];

export const FarmerShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <FieldProvider>
      <div className="dashboard-shell">
        
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`dashboard-sidebar ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="dashboard-sidebar-header">
            <div className="dashboard-sidebar-logo">
              <div className="dashboard-sidebar-logo-icon">
                <Sprout size={24} strokeWidth={2.5} />
              </div>
              <span>AgriMesh</span>
            </div>
            <button 
              className="md:hidden text-text-muted hover:text-text-main p-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className="dashboard-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`dashboard-nav-item ${isActive ? "active" : ""}`}
                >
                  <div className="dashboard-nav-item-content">
                    <Icon size={18} strokeWidth={2} />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="dashboard-nav-badge">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="dashboard-sidebar-footer">
            <div className="dashboard-sidebar-divider"></div>
            <Link to="/profile" className="dashboard-nav-item">
              <div className="dashboard-nav-item-content">
                <User size={18} strokeWidth={2} /> Profile
              </div>
            </Link>
            <Link to="/settings" className="dashboard-nav-item">
              <div className="dashboard-nav-item-content">
                <Settings size={18} strokeWidth={2} /> Settings
              </div>
            </Link>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-header-search">
              <button 
                className="md:hidden p-2 -ml-2 mr-2 text-text-main hover:bg-secondary rounded-lg"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search fields, crops, recommendations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/fields?search=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery("");
                  }
                }}
              />
            </div>

            <div className="dashboard-header-actions">
              <button className="dashboard-header-action alerts" onClick={() => navigate('/alerts')}>
                <Bell size={18} />
                <span>Alerts</span>
                <span className="dashboard-nav-badge">3</span>
              </button>
              
              <button className="dashboard-header-action language" onClick={() => alert('Language settings coming soon!')}>
                <Globe size={16} />
                <span>English</span>
                <ChevronDown size={14} />
              </button>
              
              <div className="dashboard-header-profile" onClick={() => navigate('/profile')}>
                <div className="dashboard-header-avatar">
                  <User size={14} />
                </div>
                <span className="dashboard-header-action">
                  Ramesh <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </header>

          <div className="dashboard-content">
            <Outlet />
          </div>

          <GlobalMicButton />
        </main>
      </div>
    </FieldProvider>
  );
};
