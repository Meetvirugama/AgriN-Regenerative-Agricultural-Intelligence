import React from "react";
import { 
  Settings as SettingsIcon,
  Bell,
  Leaf,
  Shield,
  Globe,
  Link as LinkIcon,
  User,
  Sun,
  Moon,
  Monitor,
  Save,
  ChevronRight,
  Info
} from "lucide-react";

export const Settings = () => {
  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-text-main">Settings</h1>
        <p className="text-text-muted mt-1 text-sm font-medium">Manage your preferences and application settings</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Navigation Sidebar */}
        <div className="w-full xl:w-64 shrink-0 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-3 bg-success/10 text-success rounded-xl font-bold text-sm border-l-4 border-success">
            <SettingsIcon size={18} /> General
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-secondary hover:text-text-main rounded-xl font-semibold text-sm transition-colors border-l-4 border-transparent">
            <Bell size={18} /> Notifications
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-secondary hover:text-text-main rounded-xl font-semibold text-sm transition-colors border-l-4 border-transparent">
            <Leaf size={18} /> Field Preferences
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-secondary hover:text-text-main rounded-xl font-semibold text-sm transition-colors border-l-4 border-transparent">
            <Shield size={18} /> Data & Privacy
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-secondary hover:text-text-main rounded-xl font-semibold text-sm transition-colors border-l-4 border-transparent">
            <Globe size={18} /> Units & Language
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-secondary hover:text-text-main rounded-xl font-semibold text-sm transition-colors border-l-4 border-transparent">
            <LinkIcon size={18} /> Integration
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-secondary hover:text-text-main rounded-xl font-semibold text-sm transition-colors border-l-4 border-transparent">
            <User size={18} /> Account
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm p-8 flex flex-col">
          <h3 className="font-bold text-text-main text-lg mb-8 pb-4 border-b border-border/60">General Settings</h3>
          
          <div className="space-y-6 max-w-2xl">
            
            {/* Form Group */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Full Name</label>
              <input type="text" defaultValue="Ramesh Kumar" className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Email Address</label>
              <input type="email" defaultValue="ramesh.kumar@example.com" className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Phone Number</label>
              <input type="tel" defaultValue="+91 98765 43210" className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Location</label>
              <input type="text" defaultValue="Madhopur, Uttar Pradesh, India" className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Language</label>
              <div className="flex-1 relative">
                <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all cursor-pointer">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 pt-2">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Theme</label>
              <div className="flex-1 flex items-center gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-success text-success bg-success/5 rounded-lg text-sm font-bold transition-colors">
                  <Sun size={16} /> Light
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border text-text-muted bg-background rounded-lg text-sm font-semibold hover:border-text-muted transition-colors">
                  <Moon size={16} /> Dark
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border text-text-muted bg-background rounded-lg text-sm font-semibold hover:border-text-muted transition-colors">
                  <Monitor size={16} /> System
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 pt-2">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Dashboard Default View</label>
              <div className="flex-1 relative">
                <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all cursor-pointer">
                  <option>Overview</option>
                  <option>List</option>
                  <option>Map</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <label className="text-sm font-semibold text-text-main w-40 shrink-0">Time Zone</label>
              <div className="flex-1 relative">
                <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all cursor-pointer">
                  <option>Asia/Kolkata (IST)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-main">Enable Sounds</p>
                <p className="text-xs font-medium text-text-muted mt-0.5">Play sounds for alerts and notifications</p>
              </div>
              <div className="w-11 h-6 bg-success rounded-full flex items-center p-1 cursor-pointer">
                <div className="w-4 h-4 bg-surface rounded-full shadow-sm ml-auto"></div>
              </div>
            </div>

          </div>

          <div className="mt-12 flex justify-center border-t border-border/60 pt-8">
            <button className="flex items-center gap-2 bg-[#14532d] text-surface px-8 py-3 rounded-lg font-bold text-sm hover:bg-[#14532d]/90 transition-colors shadow-sm">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
          
          {/* Notification Preferences */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-main text-sm mb-6">Notification Preferences</h3>
            
            <div className="space-y-5 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Email Notifications</span>
                <div className="w-10 h-5 bg-success rounded-full flex items-center p-0.5 cursor-pointer"><div className="w-4 h-4 bg-surface rounded-full shadow-sm ml-auto"></div></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Push Notifications</span>
                <div className="w-10 h-5 bg-success rounded-full flex items-center p-0.5 cursor-pointer"><div className="w-4 h-4 bg-surface rounded-full shadow-sm ml-auto"></div></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">SMS Alerts</span>
                <div className="w-10 h-5 bg-border rounded-full flex items-center p-0.5 cursor-pointer"><div className="w-4 h-4 bg-surface rounded-full shadow-sm"></div></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Weekly Summary Email</span>
                <div className="w-10 h-5 bg-success rounded-full flex items-center p-0.5 cursor-pointer"><div className="w-4 h-4 bg-surface rounded-full shadow-sm ml-auto"></div></div>
              </div>
            </div>

            <button className="text-xs font-bold text-success hover:underline flex items-center justify-end w-full gap-1">
              Manage Notifications <ChevronRight size={12} />
            </button>
          </div>

          {/* Data & Storage */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-main text-sm mb-6">Data & Storage</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Cache Data</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-text-muted">24.5 MB</span>
                  <button className="text-[10px] font-bold text-success border border-success/30 px-3 py-1.5 rounded-lg hover:bg-success/5 transition-colors">Clear Cache</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Offline Data</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-text-muted">12.1 MB</span>
                  <button className="text-[10px] font-bold text-success border border-success/30 px-3 py-1.5 rounded-lg hover:bg-success/5 transition-colors">Manage Data</button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs font-bold text-text-main">Total Storage Used</span>
                <span className="text-xs font-bold text-text-main mr-2">36.6 MB</span>
              </div>
            </div>

            <button className="text-xs font-bold text-success hover:underline flex items-center justify-end w-full gap-1">
              View Storage Details <ChevronRight size={12} />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-surface border border-danger/20 rounded-xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
            <h3 className="font-bold text-danger text-sm mb-4">Danger Zone</h3>
            
            <div>
              <p className="text-sm font-bold text-text-main mb-1">Delete Account</p>
              <p className="text-[10px] font-medium text-text-muted mb-4 leading-tight">This action cannot be undone. All your data will be permanently deleted.</p>
              <button className="w-full py-2 border border-danger text-danger bg-danger/5 rounded-lg text-xs font-bold hover:bg-danger/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Info Banner */}
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex gap-3 text-success items-center">
        <Info size={18} className="shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-success/90">Your preferences help us provide a better and personalized AgriMesh experience.</p>
      </div>

    </div>
  );
};
