import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Map, 
  BrainCircuit, 
  MessageSquare, 
  Bell, 
  Stethoscope, 
  Users, 
  Settings, 
  User, 
  Search,
  Sprout
} from "lucide-react";
import { LanguageSwitcher } from "../features/voice/components/LanguageSwitcher";
import { GlobalMicButton } from "../features/voice/components/GlobalMicButton";
import { FieldProvider } from "./providers/FieldProvider";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "My Fields", path: "/fields", icon: Map },
  { label: "Intelligence", path: "/intelligence", icon: BrainCircuit },
  { label: "Ask AgriMesh", path: "/ask", icon: MessageSquare },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Crop Diagnosis", path: "/diagnosis", icon: Stethoscope },
  { label: "Expert Support", path: "/expert", icon: Users },
];

export const FarmerShell = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <FieldProvider>
      <div className="min-h-screen bg-background flex text-text-main font-sans">
        
        {/* SIDEBAR */}
        <aside className="w-64 bg-surface border-r border-border h-screen fixed left-0 top-0 flex flex-col z-20">
          <div className="p-6 flex items-center gap-3">
            <div className="text-primary">
              <Sprout size={28} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-main">AgriMesh</span>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-text-muted hover:bg-secondary hover:text-text-main"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-1">
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-text-muted hover:bg-secondary hover:text-text-main transition-colors">
              <User size={18} />
              Profile
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-text-muted hover:bg-secondary hover:text-text-main transition-colors">
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col ml-64 min-h-screen relative">
          
          {/* TOP HEADER */}
          <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex-1 max-w-xl">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 ml-4">
              <button className="text-text-muted hover:text-text-main transition-colors relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface"></span>
              </button>
              
              <LanguageSwitcher />
              
              <div className="flex items-center gap-3 pl-6 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm text-text-main">
                  R
                </div>
                <span className="text-sm font-medium">Ramesh</span>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="p-8 flex-1 max-w-7xl w-full mx-auto relative">
            <Outlet />
          </div>

          <GlobalMicButton />
        </main>
      </div>
    </FieldProvider>
  );
};
