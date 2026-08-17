import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Stethoscope, Users, Search, Sprout, Menu, X
} from "lucide-react";
import { GlobalMicButton } from "../features/voice/components/GlobalMicButton";
import { LanguageSwitcher } from "../features/voice/components/LanguageSwitcher";
import { FieldProvider } from "./providers/FieldProvider";
import { useAuth } from "./providers/AuthProvider";
import { cropApi } from "../features/crop-context/api/cropApi";

// Animated Hover Components
import HomeIcon from "../components/hover-ui/home-icon";
import MapPinIcon from "../components/hover-ui/map-pin-icon";
import BrainCircuitIcon from "../components/hover-ui/brain-circuit-icon";
import BrandTelegramIcon from "../components/hover-ui/brand-telegram-icon";
import FilledBellIcon from "../components/hover-ui/filled-bell-icon";
import UserIcon from "../components/hover-ui/user-icon";
import DownChevron from "../components/hover-ui/down-chevron";
import GearIcon from "../components/hover-ui/gear-icon";

import "./DashboardLayout.css";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: HomeIcon },
  { label: "My Fields", path: "/fields", icon: MapPinIcon },
  { label: "Intelligence", path: "/intelligence", icon: BrainCircuitIcon },
  { label: "Ask AgriMesh", path: "/ask", icon: BrandTelegramIcon },
  { label: "Alerts", path: "/alerts", icon: FilledBellIcon },
  { label: "Crop Diagnosis", path: "/diagnosis", icon: Stethoscope },
  { label: "Expert Support", path: "/expert", icon: Users },
];

export const FarmerShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts, setAlerts] = useState([]);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await cropApi.getAlerts();
        setAlerts(data || []);
      } catch (err) {
        console.error("Failed to fetch shell alerts:", err);
      }
    };
    fetchAlerts();
  }, [location.pathname]);

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  return (
    <FieldProvider>
      <div className="dashboard-shell">
        
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`dashboard-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="dashboard-sidebar-header">
            <div className="dashboard-logo">
              <div className="dashboard-logo-icon">
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
                  {item.label === "Alerts" && activeAlertsCount > 0 && (
                    <span className="dashboard-nav-badge">
                      {activeAlertsCount}
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
                <UserIcon size={18} strokeWidth={2} /> Profile
              </div>
            </Link>
            <Link to="/settings" className="dashboard-nav-item">
              <div className="dashboard-nav-item-content">
                <GearIcon size={18} strokeWidth={2} /> Settings
              </div>
            </Link>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-search">
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
                <div className="dashboard-bell-wrapper">
                  <FilledBellIcon size={18} />
                  {activeAlertsCount > 0 && (
                    <span className="dashboard-bell-badge">{activeAlertsCount}</span>
                  )}
                </div>
                <span>Alerts</span>
              </button>
              
              <LanguageSwitcher />
              
              <div className="dashboard-header-profile">
                <div className="dashboard-header-profile-trigger">
                  <div className="dashboard-header-avatar">
                    <UserIcon size={14} />
                  </div>
                  <span className="dashboard-header-action">
                    Ramesh <DownChevron size={14} />
                  </span>
                </div>

                <div className="profile-dropdown">
                  <button onClick={() => navigate('/profile')} className="profile-dropdown-option">
                    View Profile
                  </button>
                  <button onClick={() => navigate('/settings')} className="profile-dropdown-option">
                    Settings
                  </button>
                  <div className="profile-dropdown-divider"></div>
                  <button onClick={logout} className="profile-dropdown-option signout">
                    Sign Out
                  </button>
                </div>
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
