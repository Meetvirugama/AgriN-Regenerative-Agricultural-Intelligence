import React from "react";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Sprout, 
  Globe, 
  Map, 
  Maximize, 
  Clock,
  MessageSquare,
  Bell,
  ListTodo,
  ChevronDown,
  Crown,
  Check,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Settings,
  Info,
  Camera
} from "lucide-react";
import { Link } from "react-router-dom";

export const Profile = () => {
  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-text-main">My Profile</h1>
        <p className="text-text-muted mt-1 text-sm font-medium">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-6">
          
          {/* Profile Details Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-8 flex flex-col md:flex-row gap-10">
            
            {/* Identity Column */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-border/60 pb-8 md:pb-0 md:pr-10">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-secondary text-text-muted flex items-center justify-center border-4 border-surface shadow-sm">
                  <User size={64} strokeWidth={1.5} />
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-surface border border-border shadow-sm rounded-full flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
                  <Camera size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-text-main">Ramesh Kumar</h2>
                <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded">Farmer</span>
              </div>
              
              <div className="space-y-3 w-full">
                <div className="flex items-center gap-3 text-sm font-medium text-text-muted justify-center md:justify-start">
                  <Mail size={16} className="shrink-0" />
                  <span className="truncate">ramesh.kumar@example.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-text-muted justify-center md:justify-start">
                  <Phone size={16} className="shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-text-muted justify-center md:justify-start">
                  <MapPin size={16} className="shrink-0" />
                  <span className="truncate">Madhopur, Uttar Pradesh, India</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-text-muted justify-center md:justify-start">
                  <Calendar size={16} className="shrink-0" />
                  <span>Member since 12 Nov 2024</span>
                </div>
              </div>

              <button className="w-full mt-8 py-2.5 border border-border text-text-main rounded-lg text-sm font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2">
                <Edit3 size={16} /> Edit Profile
              </button>
            </div>

            {/* About Me Column */}
            <div className="flex-1">
              <h3 className="font-bold text-text-main text-base mb-6">About Me</h3>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
                    <Sprout size={18} className="text-success" /> Farming Experience
                  </div>
                  <span className="font-bold text-sm text-text-main">8+ years</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
                    <Globe size={18} className="text-success" /> Preferred Language
                  </div>
                  <span className="font-bold text-sm text-text-main">English</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
                    <Leaf size={18} className="text-success" /> Primary Crops
                  </div>
                  <span className="font-bold text-sm text-text-main text-right">Wheat, Rice, Moong</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
                    <Map size={18} className="text-success" /> Total Fields
                  </div>
                  <span className="font-bold text-sm text-text-main">3</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
                    <Maximize size={18} className="text-success" /> Total Area
                  </div>
                  <span className="font-bold text-sm text-text-main">12.45 acres</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
                    <Clock size={18} className="text-success" /> Time Zone
                  </div>
                  <span className="font-bold text-sm text-text-main">Asia/Kolkata (IST)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Subscription Plan Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
            <div className="flex gap-4 w-full md:w-auto items-center">
              <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 border border-success/20">
                <Crown size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted mb-1">Subscription Plan</p>
                <h3 className="font-bold text-text-main text-xl mb-1">AgriMesh Free Plan</h3>
                <p className="text-xs font-medium text-text-muted mb-2">You are using the free plan with limited features.</p>
                <button className="text-xs font-bold text-success hover:underline flex items-center gap-1">
                  View Plan Details <ChevronRight size={12} />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full md:w-auto">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                  <Check size={16} className="text-success" /> Basic field monitoring
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                  <Check size={16} className="text-success" /> AI recommendations (limited)
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                  <Check size={16} className="text-success" /> Community support
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-end">
                <button className="px-6 py-2.5 border border-success text-success rounded-lg font-bold hover:bg-success/5 transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) - Activity Summary */}
        <div className="w-full xl:w-[400px] bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-text-main text-base">Activity Summary</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-xs font-bold text-text-muted hover:text-text-main transition-colors">
              Last 30 Days <ChevronDown size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            <div className="border border-border/60 rounded-xl p-4 bg-background">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                  <Sprout size={20} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-text-main leading-none">18</h4>
                  <p className="text-[10px] font-bold text-text-muted mt-1">Field Scans</p>
                </div>
              </div>
              <p className="text-[9px] font-bold text-success flex items-center gap-1">
                <span className="text-success text-xs leading-none">&uarr;</span> 20% from last 30 days
              </p>
            </div>

            <div className="border border-border/60 rounded-xl p-4 bg-background">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-text-main leading-none">7</h4>
                  <p className="text-[10px] font-bold text-text-muted mt-1">Expert Chats</p>
                </div>
              </div>
              <p className="text-[9px] font-bold text-success flex items-center gap-1">
                <span className="text-success text-xs leading-none">&uarr;</span> 16% from last 30 days
              </p>
            </div>

            <div className="border border-border/60 rounded-xl p-4 bg-background">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-text-main leading-none">3</h4>
                  <p className="text-[10px] font-bold text-text-muted mt-1">Alerts Received</p>
                </div>
              </div>
              <p className="text-[9px] font-bold text-danger flex items-center gap-1">
                <span className="text-danger text-xs leading-none">&darr;</span> 25% from last 30 days
              </p>
            </div>

            <div className="border border-border/60 rounded-xl p-4 bg-background">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center shrink-0">
                  <ListTodo size={20} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-text-main leading-none">12</h4>
                  <p className="text-[10px] font-bold text-text-muted mt-1">Recommendations</p>
                </div>
              </div>
              <p className="text-[9px] font-bold text-success flex items-center gap-1">
                <span className="text-success text-xs leading-none">&uarr;</span> 33% from last 30 days
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Quick Links Banner */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-text-main text-base mb-6">Quick Links</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
          
          <Link to="/fields" className="flex items-center justify-between group pt-4 md:pt-0 md:px-4 first:pt-0 first:px-0">
            <div className="flex gap-4">
              <Leaf size={24} strokeWidth={1.5} className="text-text-main group-hover:text-success transition-colors shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-text-main mb-1">My Fields</h4>
                <p className="text-[11px] font-medium text-text-muted leading-tight">View and manage<br/>your fields</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-muted group-hover:text-text-main transition-colors" />
          </Link>

          <Link to="/diagnosis" className="flex items-center justify-between group pt-4 md:pt-0 md:px-4">
            <div className="flex gap-4">
              <ShieldCheck size={24} strokeWidth={1.5} className="text-text-main group-hover:text-success transition-colors shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-text-main mb-1">Crop Diagnosis</h4>
                <p className="text-[11px] font-medium text-text-muted leading-tight">Diagnose crop<br/>issues</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-muted group-hover:text-text-main transition-colors" />
          </Link>

          <Link to="/expert" className="flex items-center justify-between group pt-4 md:pt-0 md:px-4">
            <div className="flex gap-4">
              <User size={24} strokeWidth={1.5} className="text-text-main group-hover:text-success transition-colors shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-text-main mb-1">Expert Support</h4>
                <p className="text-[11px] font-medium text-text-muted leading-tight">Get help from<br/>experts</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-muted group-hover:text-text-main transition-colors" />
          </Link>

          <Link to="/settings" className="flex items-center justify-between group pt-4 md:pt-0 md:px-4">
            <div className="flex gap-4">
              <Settings size={24} strokeWidth={1.5} className="text-text-main group-hover:text-success transition-colors shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-text-main mb-1">Settings</h4>
                <p className="text-[11px] font-medium text-text-muted leading-tight">Manage account<br/>and preferences</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-muted group-hover:text-text-main transition-colors" />
          </Link>

        </div>
      </div>

      {/* Footer Info Banner */}
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex gap-3 text-success items-center">
        <Info size={18} className="shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-success/90">Keep your profile information updated to get personalized recommendations and better insights.</p>
      </div>

    </div>
  );
};
