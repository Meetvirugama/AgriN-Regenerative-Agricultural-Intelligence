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

        <aside className={`dashboard-sidebar transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
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
            {/* Mobile Menu Toggle - Always visible on mobile */}
            <button 
              className="md:hidden p-2 -ml-4 mr-2 text-text-main hover:bg-secondary rounded-lg flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div id="header-portal" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}></div>
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
