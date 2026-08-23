import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Stethoscope, Search, Menu, X,
  Home as HomeIconLucide, MapPin, BellDot, ScanLine, User as UserLucide,
  BrainCircuit, MessageSquare, Settings as SettingsLucide,
  Users, Sprout, TrendingUp
} from "lucide-react";
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
  { label: "Market Prices", path: "/market-prices", icon: TrendingUp },
];

const SidebarNavItem = ({ item, isActive, activeAlertsCount, onClick, t }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`dashboard-nav-item ${isActive ? "active" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="dashboard-nav-item-content">
        <Icon size={18} strokeWidth={2} isHovered={isHovered} />
        {t(`nav.${item.label}`)}
      </div>
      {item.label === "Alerts" && activeAlertsCount > 0 && (
        <span className="dashboard-nav-badge">
          {activeAlertsCount}
        </span>
      )}
    </Link>
  );
};

const FooterNavItem = ({ to, icon: Icon, label, onClick, t }) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`dashboard-nav-item dashboard-footer-item ${isActive ? "active" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="dashboard-nav-item-content">
        <Icon size={18} strokeWidth={2} isHovered={isHovered} />
        {t(`nav.${label}`)}
      </div>
    </Link>
  );
};

export const FarmerShell = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, farmer } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts, setAlerts] = useState([]);
  
  // Header Hover States
  const [isAlertsHovered, setIsAlertsHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

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
            className="dashboard-mobile-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`dashboard-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="dashboard-sidebar-header">
            <div className="dashboard-sidebar-logo">
              <img src="/agri-logo.png" alt="AgriMesh Logo" className="dashboard-sidebar-logo-img" />
              <span>AgriMesh</span>
            </div>
            <button 
              className="dashboard-mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              type="button"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="dashboard-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <SidebarNavItem 
                  key={item.label} 
                  item={item} 
                  isActive={isActive} 
                  activeAlertsCount={activeAlertsCount} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  t={t}
                />
              );
            })}
          </nav>

          <div className="dashboard-sidebar-footer">
            <div className="dashboard-sidebar-divider"></div>
            <FooterNavItem to="/profile" icon={UserIcon} label="Profile" onClick={() => setIsMobileMenuOpen(false)} t={t} />
            <FooterNavItem to="/settings" icon={GearIcon} label="Settings" onClick={() => setIsMobileMenuOpen(false)} t={t} />
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
              {/* Mobile Menu removed as requested */}

              {location.pathname === '/intelligence' ? (
                <div id="intelligence-header-portal" className="intelligence-header-portal-slot"></div>
              ) : location.pathname === '/alerts' ? (
                <div id="alerts-header-portal" className="dashboard-alerts-portal"></div>
              ) : location.pathname === '/ask' ? (
                <div id="ask-header-portal" className="intelligence-header-portal-slot"></div>
              ) : location.pathname === '/' ? (
                <div className="dashboard-header-search">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder={t("search.placeholder")}
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
              ) : (
                <div id="header-portal" className="dashboard-header-portal" />
              )}

              <div className="dashboard-header-actions">
                    <button 
                      className="dashboard-header-action alerts hide-on-mobile" 
                      onClick={() => navigate('/alerts')}
                      onMouseEnter={() => setIsAlertsHovered(true)}
                      onMouseLeave={() => setIsAlertsHovered(false)}
                    >
                      <div className="dashboard-bell-wrapper">
                        <FilledBellIcon size={18} isHovered={isAlertsHovered} />
                        {activeAlertsCount > 0 && (
                          <span className="dashboard-bell-badge">{activeAlertsCount}</span>
                        )}
                      </div>
                      <span>Alerts</span>
                    </button>
                    
                    <LanguageSwitcher />
                    
                    <div 
                      className="dashboard-header-profile"
                      onMouseEnter={() => setIsProfileHovered(true)}
                      onMouseLeave={() => setIsProfileHovered(false)}
                    >
                      <div className="dashboard-header-profile-trigger">
                        <div className="dashboard-header-avatar">
                          <UserIcon size={14} isHovered={isProfileHovered} />
                        </div>
                        <span className="dashboard-header-action">
                          <span className="farmer-name-text">{farmer?.name ? farmer.name.split(' ')[0] : "Farmer"}</span> 
                          <DownChevron size={14} isHovered={isProfileHovered} />
                        </span>
                      </div>

                      <div className="profile-dropdown">
                        <button onClick={() => navigate('/profile')} className="profile-dropdown-option">
                          {t("nav.View Profile")}
                        </button>
                        <button onClick={() => navigate('/settings')} className="profile-dropdown-option">
                          {t("nav.Settings")}
                        </button>
                        <div className="profile-dropdown-divider"></div>
                        <button onClick={logout} className="profile-dropdown-option signout">
                          {t("nav.Sign Out")}
                        </button>
                      </div>
                    </div>
                  </div>
            </header>

          {/* ── Mobile Bottom Navigation — always visible on mobile ── */}
          <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            {[
              { to: "/",         icon: HomeIconLucide, label: "Home" },
              { to: "/fields",   icon: MapPin,         label: "Fields" },
              { to: "/intelligence", icon: BrainCircuit, label: "AI" },
              { to: "/ask",      icon: MessageSquare,  label: "Ask" },
              { to: "/alerts",   icon: BellDot,        label: "Alerts" },
              { to: "/diagnosis",icon: ScanLine,       label: "Scan" },
              { to: "/profile",  icon: UserLucide,     label: "Profile" },
              { to: "/settings", icon: SettingsLucide, label: "Settings" },
            ].map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to ||
                (to !== "/" && location.pathname.startsWith(to));

              return (
                <Link
                  key={label}
                  to={to}
                  className={`mobile-bottom-nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={22} strokeWidth={2.5} />
                  <span>{t(`nav.${label}`)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="dashboard-content">
            <Outlet />
          </div>
        </main>
      </div>
    </FieldProvider>
  );
};
