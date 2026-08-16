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
  Sprout,
  Globe,
  ChevronDown,
  Sun
} from "lucide-react";
import { GlobalMicButton } from "../features/voice/components/GlobalMicButton";
import { FieldProvider } from "./providers/FieldProvider";

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

  return (
    <FieldProvider>
      <div className="min-h-screen bg-background flex text-text-main font-sans">
        
        {/* SIDEBAR */}
        <aside className="w-64 bg-surface border-r border-border h-screen fixed left-0 top-0 flex flex-col z-20">
          <div className="p-6 flex items-center gap-3">
            <div className="text-primary">
              <Sprout size={28} strokeWidth={2.5} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-main">AgriMesh</span>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-text-muted hover:bg-secondary hover:text-text-main"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="bg-danger text-surface text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-1.5 mb-2">
            <div className="w-full h-px bg-border mb-4"></div>
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-text-muted hover:bg-secondary hover:text-text-main transition-colors">
              <User size={20} />
              Profile
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-text-muted hover:bg-secondary hover:text-text-main transition-colors">
              <Settings size={20} />
              Settings
            </Link>
            
            <div className="w-full h-px bg-border my-4"></div>
            
            <div className="px-3 py-2 flex items-center gap-3">
              <Sun size={32} className="text-warning stroke-2 shrink-0" />
              <div>
                <div className="text-lg font-bold text-text-main flex items-center gap-1">32°C</div>
                <div className="text-[11px] font-medium text-text-muted mt-0.5 leading-tight">
                  Sunny<br/>
                  Madhopur, UP
                </div>
                <Link to="/intelligence" className="text-[10px] font-bold text-primary hover:underline mt-1 inline-block">
                  View Forecast &rarr;
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col ml-64 min-h-screen relative">
          
          {/* TOP HEADER */}
          <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex-1 max-w-xl">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search fields, crops, recommendations..." 
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 ml-4">
              
              {/* Alerts */}
              <button className="flex items-center gap-2 text-text-main font-medium hover:text-primary transition-colors">
                <div className="relative">
                  <Bell size={20} />
                </div>
                <span className="text-sm">Alerts</span>
                <span className="bg-danger text-surface text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ml-1">
                  3
                </span>
              </button>
              
              {/* Language */}
              <button className="flex items-center gap-2 text-text-main font-medium hover:text-primary transition-colors">
                <Globe size={18} className="text-text-muted" />
                <span className="text-sm">English</span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>
              
              {/* Profile */}
              <button className="flex items-center gap-3 pl-6 border-l border-border hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm text-text-muted">
                  <User size={16} />
                </div>
                <span className="text-sm font-medium text-text-main flex items-center gap-2">
                  Ramesh <ChevronDown size={16} className="text-text-muted" />
                </span>
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="p-8 flex-1 max-w-[1400px] w-full mx-auto relative">
            <Outlet />
          </div>

          <GlobalMicButton />
        </main>
      </div>
    </FieldProvider>
  );
};
