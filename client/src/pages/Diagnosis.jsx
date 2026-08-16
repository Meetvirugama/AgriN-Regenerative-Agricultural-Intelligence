import React from "react";
import { 
  ChevronRight, 
  Upload, 
  Download, 
  ShieldAlert, 
  Maximize2, 
  Info,
  Lightbulb,
  ChevronLeft,
  ShieldCheck,
  Leaf,
  Zap,
  CalendarClock,
  UserSquare2,
  Share2,
  ListTodo
} from "lucide-react";
import { Link } from "react-router-dom";

export const Diagnosis = () => {
  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
            <span className="hover:text-text-main cursor-pointer transition-colors">Crop Diagnosis</span>
            <ChevronRight size={14} />
            <span className="text-text-main font-semibold">Diagnosis Result</span>
          </div>
          <h1 className="text-3xl font-bold text-text-main">Diagnosis Result</h1>
          <p className="text-text-muted mt-1 text-sm font-medium">Analysis completed on 18 Jun 2025, 10:30 AM</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-secondary transition-colors shadow-sm">
            <Upload size={16} className="text-text-main" /> Upload New Image
          </button>
          <button className="flex items-center gap-2 bg-text-main text-surface px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-text-main/90 transition-colors shadow-sm">
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content (Left) */}
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* Top Result Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-8">
            
            <div className="w-full md:w-[320px] shrink-0 relative rounded-xl overflow-hidden border border-border shadow-sm group">
              <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=800&q=80" alt="Diseased leaf" className="w-full h-[220px] object-cover group-hover:scale-105 transition-transform duration-500" />
              <button className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur text-text-main px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-surface transition-colors">
                <Maximize2 size={14} /> View Original
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="inline-flex items-center gap-1.5 bg-danger/10 text-danger px-3 py-1 rounded-lg text-xs font-bold mb-3 w-max">
                <ShieldAlert size={14} /> High Confidence (92%)
              </div>
              
              <h2 className="text-2xl font-bold text-text-main mb-6">Brown Spot (Bipolaris sorokiniana)</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-auto">
                <div className="flex items-center justify-between sm:justify-start sm:gap-8">
                  <div className="flex items-center gap-2 text-text-muted text-sm font-semibold w-24">
                    <Leaf size={16} /> Detected In
                  </div>
                  <span className="font-bold text-sm text-text-main">Wheat</span>
                </div>
                
                <div className="flex items-center justify-between sm:justify-start sm:gap-8">
                  <div className="flex items-center gap-2 text-text-muted text-sm font-semibold w-24">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                    Field
                  </div>
                  <span className="font-bold text-sm text-text-main">Wheat Field 01</span>
                </div>
                
                <div className="flex items-center justify-between sm:justify-start sm:gap-8">
                  <div className="flex items-center gap-2 text-text-muted text-sm font-semibold w-24">
                    <CalendarClock size={16} /> Detected On
                  </div>
                  <span className="font-bold text-sm text-text-main">18 Jun 2025, 10:30 AM</span>
                </div>
                
                <div className="flex items-center justify-between sm:justify-start sm:gap-8">
                  <div className="flex items-center gap-2 text-text-muted text-sm font-semibold w-24">
                    <ListTodo size={16} /> Analysis ID
                  </div>
                  <span className="font-bold text-sm text-text-main">DIAG-2025-0618-1030</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border/50 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted shrink-0">
                  AI Confidence Score <Info size={14} />
                </div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full w-[92%]"></div>
                </div>
                <span className="text-sm font-bold text-text-main shrink-0">92%</span>
              </div>

            </div>
          </div>

          {/* Details Tabs Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center border-b border-border/60 px-2 overflow-x-auto bg-secondary/10">
              <button className="px-5 py-4 text-sm font-bold text-primary border-b-2 border-primary whitespace-nowrap">About the Disease</button>
              <button className="px-5 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Symptoms</button>
              <button className="px-5 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Causes</button>
              <button className="px-5 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Conditions</button>
              <button className="px-5 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Prevention</button>
            </div>

            <div className="p-6">
              <p className="text-sm text-text-muted font-medium leading-relaxed mb-6">
                Brown spot is a fungal disease that affects leaves, leaf sheaths, and glumes of wheat. It can reduce yield and grain quality if not managed early.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-border/60 rounded-xl p-4 bg-background">
                  <h4 className="text-xs font-bold text-text-muted mb-2">Affects</h4>
                  <p className="text-sm font-bold text-text-main leading-tight">Leaves, Leaf Sheath,<br/>Glumes</p>
                </div>
                <div className="border border-border/60 rounded-xl p-4 bg-background">
                  <h4 className="text-xs font-bold text-text-muted mb-2">Spread By</h4>
                  <p className="text-sm font-bold text-text-main leading-tight">Fungal spores, Wind,<br/>Crop residue</p>
                </div>
                <div className="border border-border/60 rounded-xl p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-bold text-text-muted">Risk Level</h4>
                    <span className="text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">High</span>
                  </div>
                  <p className="text-sm font-bold text-text-main leading-tight">Can cause up to<br/>20-30% yield loss</p>
                </div>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex gap-3 text-success items-center">
                <Lightbulb size={20} className="shrink-0" />
                <p className="text-sm font-bold text-success/90">Early detection and proper management can significantly reduce crop damage.</p>
              </div>
            </div>
          </div>

          {/* Similar Cases Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-main text-base">Similar Cases in Your Area</h3>
              <button className="text-xs font-bold text-success hover:underline">View All</button>
            </div>

            <div className="relative flex items-center">
              <button className="absolute left-0 -ml-4 z-10 w-8 h-8 bg-surface border border-border shadow-md rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-secondary transition-colors">
                <ChevronLeft size={16} />
              </button>
              
              <div className="w-full overflow-hidden">
                <div className="flex gap-4">
                  {/* Case 1 */}
                  <div className="flex-1 flex gap-3 border border-border/60 rounded-xl p-3 bg-background items-center">
                    <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=100&q=80" alt="Wheat" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-text-main truncate">Brown Spot in Wheat</h4>
                      <p className="text-[10px] text-text-muted mt-0.5 truncate">Wheat Field 02</p>
                      <p className="text-[10px] text-text-muted truncate">Madhopur, UP</p>
                      <p className="text-[10px] text-text-muted truncate">17 Jun 2025</p>
                    </div>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded self-end shrink-0 mb-1">Resolved</span>
                  </div>

                  {/* Case 2 */}
                  <div className="flex-1 flex gap-3 border border-border/60 rounded-xl p-3 bg-background items-center">
                    <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=100&q=80" alt="Wheat" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-text-main truncate">Brown Spot in Wheat</h4>
                      <p className="text-[10px] text-text-muted mt-0.5 truncate">Wheat Field 03</p>
                      <p className="text-[10px] text-text-muted truncate">Madhopur, UP</p>
                      <p className="text-[10px] text-text-muted truncate">16 Jun 2025</p>
                    </div>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded self-end shrink-0 mb-1">Resolved</span>
                  </div>

                  {/* Case 3 */}
                  <div className="flex-1 hidden lg:flex gap-3 border border-border/60 rounded-xl p-3 bg-background items-center">
                    <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=100&q=80" alt="Wheat" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-text-main truncate">Brown Spot in Wheat</h4>
                      <p className="text-[10px] text-text-muted mt-0.5 truncate">Wheat Field 05</p>
                      <p className="text-[10px] text-text-muted truncate">Madhopur, UP</p>
                      <p className="text-[10px] text-text-muted truncate">15 Jun 2025</p>
                    </div>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded self-end shrink-0 mb-1">Resolved</span>
                  </div>
                </div>
              </div>

              <button className="absolute right-0 -mr-4 z-10 w-8 h-8 bg-surface border border-border shadow-md rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-secondary transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Footer Banner */}
          <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 text-info items-start">
              <Info size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted font-medium mt-0.5">This diagnosis is AI-generated. Please consult local agricultural experts for final decision.</p>
            </div>
            <div className="text-xs font-medium text-text-muted shrink-0">
              Need help? Contact <Link to="/expert" className="font-bold text-success hover:underline">Expert Support</Link>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[380px] flex flex-col gap-6 shrink-0">
          
          {/* Recommended Solutions */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={20} className="text-success" />
              <h3 className="font-bold text-success text-base">Recommended Solutions</h3>
            </div>

            <div className="space-y-4">
              
              <div className="border border-border/60 rounded-xl bg-background overflow-hidden cursor-pointer hover:border-success/50 transition-colors group">
                <div className="p-4 border-b border-border/60">
                  <p className="text-xs font-bold text-text-muted mb-3">Fungicide Recommendation</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                        <Leaf size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-main group-hover:text-success transition-colors">Propiconazole 25% EC</h4>
                        <p className="text-xs text-text-muted mt-0.5">Dose: 1 ml per liter of water</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl bg-background overflow-hidden cursor-pointer hover:border-success/50 transition-colors group">
                <div className="p-4 border-b border-border/60">
                  <p className="text-xs font-bold text-text-muted mb-3">Alternative Options</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                        <Leaf size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-main group-hover:text-success transition-colors">Tebuconazole 25.9% EC</h4>
                        <p className="text-xs text-text-muted mt-0.5">Dose: 1 ml per liter of water</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl bg-background overflow-hidden cursor-pointer hover:border-success/50 transition-colors group">
                <div className="p-4 border-b border-border/60">
                  <p className="text-xs font-bold text-text-muted mb-3">Organic / Biocontrol</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                        <Leaf size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-main group-hover:text-success transition-colors">Trichoderma viride</h4>
                        <p className="text-xs text-text-muted mt-0.5">Dose: 4 kg per acre</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-success" />
              <h3 className="font-bold text-success text-base">Quick Actions</h3>
            </div>

            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-center gap-3">
                  <CalendarClock size={18} className="text-success shrink-0" />
                  <span className="text-sm font-bold text-text-main group-hover:text-success transition-colors">Set Treatment Reminder</span>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-center gap-3">
                  <UserSquare2 size={18} className="text-success shrink-0" />
                  <span className="text-sm font-bold text-text-main group-hover:text-success transition-colors">Schedule Field Visit</span>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-center gap-3">
                  <Share2 size={18} className="text-success shrink-0" />
                  <span className="text-sm font-bold text-text-main group-hover:text-success transition-colors">Share with Expert</span>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-center gap-3">
                  <ListTodo size={18} className="text-text-main shrink-0" />
                  <span className="text-sm font-bold text-text-main group-hover:text-success transition-colors">View Similar Cases</span>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
