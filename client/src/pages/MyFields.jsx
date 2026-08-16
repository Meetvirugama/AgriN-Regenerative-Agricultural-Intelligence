import React, { useState } from "react";
import { 
  Plus, 
  Upload,
  MoreVertical, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Leaf, 
  Sprout,
  ShieldAlert,
  Search,
  MapPin,
  Maximize,
  CalendarDays,
  Droplet,
  Lock,
  User,
  ArrowRight,
  Lightbulb,
  X,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MyFields = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">My Fields</h1>
          <p className="text-text-muted mt-1 text-sm font-medium">Manage and monitor all your fields</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/fields/add')}
            className="flex items-center gap-2 bg-[#14532d] text-surface px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#14532d]/90 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus size={18} strokeWidth={2.5} /> Add New Field
          </button>
          <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg font-bold text-sm text-text-main hover:bg-secondary transition-colors shadow-sm hidden md:flex">
            <Upload size={16} /> Import Field Data
          </button>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <Leaf size={24} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted">Total Fields</p>
            <h3 className="text-2xl font-black text-text-main leading-tight mt-0.5">3</h3>
            <p className="text-xs font-medium text-text-muted mt-0.5">Active fields</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
            <Sprout size={24} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted">Total Area</p>
            <h3 className="text-2xl font-black text-text-main leading-tight mt-0.5">12.45</h3>
            <p className="text-xs font-medium text-text-muted mt-0.5">acres</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Sprout size={24} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted">Healthy Fields</p>
            <h3 className="text-2xl font-black text-text-main leading-tight mt-0.5">2</h3>
            <p className="text-xs font-medium text-text-muted mt-0.5">66.7%</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
            <ShieldAlert size={24} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted">Attention Needed</p>
            <h3 className="text-2xl font-black text-text-main leading-tight mt-0.5">1</h3>
            <p className="text-xs font-medium text-text-muted mt-0.5">33.3%</p>
          </div>
        </div>

      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-6">
          
          {/* CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="relative w-full md:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search fields..." 
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-medium focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold text-text-main hover:bg-secondary transition-colors shadow-sm shrink-0">
                All Crops <ChevronDown size={16} className="text-text-muted" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold text-text-main hover:bg-secondary transition-colors shadow-sm shrink-0">
                All Status <ChevronDown size={16} className="text-text-muted" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold text-text-main hover:bg-secondary transition-colors shadow-sm shrink-0">
                Sort By <ChevronDown size={16} className="text-text-muted" />
              </button>
              
              <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden shadow-sm shrink-0 ml-1">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "text-success bg-success/10" : "text-text-muted hover:bg-secondary"}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <div className="w-px h-5 bg-border"></div>
                <button 
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "text-success bg-success/10" : "text-text-muted hover:bg-secondary"}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* FIELD CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Wheat Field 01 */}
            <div className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group">
              <div className="h-36 w-full relative">
                <img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=200&fit=crop" alt="Wheat" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-success/90 backdrop-blur text-surface px-2.5 py-1 rounded text-xs font-bold">
                  Healthy
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 bg-surface/90 backdrop-blur rounded-full flex items-center justify-center text-text-main hover:bg-surface transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-text-main text-lg mb-3">Wheat Field 01</h3>
                
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <Leaf size={16} className="text-success shrink-0" /> Wheat
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <MapPin size={16} className="text-text-muted shrink-0" /> Madhopur, UP
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <Maximize size={16} className="text-text-muted shrink-0" /> 4.25 acres
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <CalendarDays size={16} className="text-text-muted shrink-0" /> Sown on 12 Nov 2024
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-text-muted">Field Health</span>
                    <span className="text-xs font-bold text-success">Good</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-success rounded-full w-[82%]"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-text-muted">Last Updated: 18 Jun 2025, 10:20 AM</span>
                    <span className="text-[10px] font-bold text-text-main">82%</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/fields/stub')} 
                  className="w-full mt-5 py-2.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  View Details <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Rice Field 02 */}
            <div className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group">
              <div className="h-36 w-full relative">
                <img src="https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=400&h=200&fit=crop" alt="Rice" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-warning/90 backdrop-blur text-surface px-2.5 py-1 rounded text-xs font-bold">
                  Attention
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 bg-surface/90 backdrop-blur rounded-full flex items-center justify-center text-text-main hover:bg-surface transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-text-main text-lg mb-3">Rice Field 02</h3>
                
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <Leaf size={16} className="text-success shrink-0" /> Rice
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <MapPin size={16} className="text-text-muted shrink-0" /> Madhopur, UP
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <Maximize size={16} className="text-text-muted shrink-0" /> 3.80 acres
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <CalendarDays size={16} className="text-text-muted shrink-0" /> Sown on 20 Jun 2024
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-text-muted">Field Health</span>
                    <span className="text-xs font-bold text-warning">Moderate</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-warning rounded-full w-[56%]"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-text-muted">Last Updated: 18 Jun 2025, 09:45 AM</span>
                    <span className="text-[10px] font-bold text-text-main">56%</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/fields/stub')} 
                  className="w-full mt-5 py-2.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  View Details <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Moong Field 03 */}
            <div className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group">
              <div className="h-36 w-full relative">
                <img src="https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=400&h=200&fit=crop" alt="Moong" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-success/90 backdrop-blur text-surface px-2.5 py-1 rounded text-xs font-bold">
                  Healthy
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 bg-surface/90 backdrop-blur rounded-full flex items-center justify-center text-text-main hover:bg-surface transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-text-main text-lg mb-3">Moong Field 03</h3>
                
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <Leaf size={16} className="text-success shrink-0" /> Moong
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <MapPin size={16} className="text-text-muted shrink-0" /> Madhopur, UP
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <Maximize size={16} className="text-text-muted shrink-0" /> 4.40 acres
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-main">
                    <CalendarDays size={16} className="text-text-muted shrink-0" /> Sown on 05 Apr 2025
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-text-muted">Field Health</span>
                    <span className="text-xs font-bold text-success">Good</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-success rounded-full w-[78%]"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-text-muted">Last Updated: 18 Jun 2025, 10:05 AM</span>
                    <span className="text-[10px] font-bold text-text-main">78%</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/fields/stub')} 
                  className="w-full mt-5 py-2.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  View Details <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Info Banner */}
          <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-success">
              <Info size={18} className="shrink-0" />
              <p className="text-xs font-semibold text-success/90">Keep your field data updated for more accurate insights and recommendations.</p>
            </div>
            <button className="text-success/70 hover:text-success transition-colors"><X size={16} /></button>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
          
          {/* Field Insights */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sprout size={18} className="text-success" />
              <h3 className="font-bold text-text-main text-sm">Field Insights</h3>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 mb-6">
                {/* SVG Donut Chart Placeholder */}
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="6" strokeDasharray="66.7 33.3" strokeDashoffset="0"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="33.3 66.7" strokeDashoffset="-66.7"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-text-main">3</span>
                  <span className="text-[10px] font-bold text-text-muted">Total</span>
                </div>
              </div>

              <div className="w-full space-y-2.5">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div><span className="text-xs font-semibold text-text-main">Healthy</span></div><span className="text-xs font-medium text-text-muted">2 (66.7%)</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"></div><span className="text-xs font-semibold text-text-main">Moderate</span></div><span className="text-xs font-medium text-text-muted">1 (33.3%)</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-danger"></div><span className="text-xs font-semibold text-text-main">Poor</span></div><span className="text-xs font-medium text-text-muted">0 (0%)</span></div>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays size={18} className="text-success" />
              <h3 className="font-bold text-text-main text-sm">Upcoming Tasks</h3>
            </div>
            
            <div className="space-y-4 mb-4">
              <div className="flex items-start justify-between gap-3 group cursor-pointer">
                <div className="flex items-start gap-3">
                  <Droplet size={14} className="text-info shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-text-main group-hover:text-success transition-colors leading-tight">Irrigate Rice Field 02</p>
                </div>
                <span className="text-[10px] font-bold text-warning shrink-0">Due in 1 day</span>
              </div>
              
              <div className="flex items-start justify-between gap-3 group cursor-pointer">
                <div className="flex items-start gap-3">
                  <Lock size={14} className="text-text-muted shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-text-main group-hover:text-success transition-colors leading-tight">Apply Urea - Wheat Field 01</p>
                </div>
                <span className="text-[10px] font-medium text-text-muted shrink-0">Due in 3 days</span>
              </div>
              
              <div className="flex items-start justify-between gap-3 group cursor-pointer">
                <div className="flex items-start gap-3">
                  <User size={14} className="text-text-muted shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-text-main group-hover:text-success transition-colors leading-tight">Check for Aphids - Moong Field 03</p>
                </div>
                <span className="text-[10px] font-medium text-text-muted shrink-0 text-right max-w-[40px] leading-tight">Due in 5 days</span>
              </div>
            </div>

            <button className="text-xs font-bold text-success hover:underline flex items-center justify-end w-full gap-1">
              View All Tasks <ArrowRight size={12} />
            </button>
          </div>

          {/* Smart Recommendations */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb size={18} className="text-warning" />
              <h3 className="font-bold text-text-main text-sm">Smart Recommendations</h3>
            </div>
            
            <div className="space-y-5 mb-4">
              <div className="cursor-pointer group">
                <p className="text-xs font-bold text-text-main group-hover:text-success transition-colors leading-tight mb-1">Irrigate Rice Field 02 in the next 24 hours</p>
                <p className="text-[10px] font-medium text-text-muted leading-tight">Soil moisture is below optimal range.</p>
              </div>
              
              <div className="cursor-pointer group">
                <p className="text-xs font-bold text-text-main group-hover:text-success transition-colors leading-tight mb-1">Apply nitrogen fertilizer in Wheat Field 01</p>
                <p className="text-[10px] font-medium text-text-muted leading-tight">Crop is at tillering stage.</p>
              </div>
            </div>

            <button className="text-xs font-bold text-success hover:underline flex items-center justify-end w-full gap-1 pt-2">
              View All Recommendations <ArrowRight size={12} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
