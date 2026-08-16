import React from "react";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronDown, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Bug,
  Droplet,
  Leaf,
  CloudRain,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

export const Alerts = () => {
  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Alerts</h1>
          <p className="text-text-muted mt-1 text-sm font-medium">Stay updated with important alerts for your fields</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-secondary transition-colors shadow-sm">
            All Fields <ChevronDown size={16} className="text-text-muted" />
          </button>
          <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-secondary transition-colors shadow-sm">
            <CheckCircle2 size={16} className="text-text-muted" /> Mark all as read
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content (Left) */}
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-surface border border-danger/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <span className="text-danger font-bold text-sm">High Priority</span>
              </div>
              <h3 className="text-3xl font-black text-text-main mt-1">1</h3>
              <p className="text-xs text-text-muted font-medium mt-1">Needs immediate action</p>
            </div>

            <div className="bg-surface border border-warning/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <span className="text-warning font-bold text-sm">Medium Priority</span>
              </div>
              <h3 className="text-3xl font-black text-text-main mt-1">2</h3>
              <p className="text-xs text-text-muted font-medium mt-1">Needs attention</p>
            </div>

            <div className="bg-surface border border-info/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                  <Info size={16} strokeWidth={2.5} />
                </div>
                <span className="text-info font-bold text-sm">Low Priority</span>
              </div>
              <h3 className="text-3xl font-black text-text-main mt-1">0</h3>
              <p className="text-xs text-text-muted font-medium mt-1">For your information</p>
            </div>

            <div className="bg-surface border border-success/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                </div>
                <span className="text-success font-bold text-sm">Resolved</span>
              </div>
              <h3 className="text-3xl font-black text-text-main mt-1">12</h3>
              <p className="text-xs text-text-muted font-medium mt-1">Last 7 days</p>
            </div>
            
          </div>

          {/* List Area */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Tabs */}
            <div className="flex items-center border-b border-border/60 px-2 overflow-x-auto">
              <button className="px-4 py-4 text-sm font-bold text-primary border-b-2 border-primary whitespace-nowrap">All Alerts</button>
              <button className="px-4 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Unread (3)</button>
              <button className="px-4 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">High (1)</button>
              <button className="px-4 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Medium (2)</button>
              <button className="px-4 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Low (0)</button>
              <button className="px-4 py-4 text-sm font-semibold text-text-muted hover:text-text-main transition-colors whitespace-nowrap">Resolved</button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/60 bg-secondary/30">
              <div className="col-span-6 md:col-span-6 text-xs font-bold text-text-muted uppercase tracking-wider">Alert</div>
              <div className="col-span-2 hidden md:block text-xs font-bold text-text-muted uppercase tracking-wider">Field</div>
              <div className="col-span-2 hidden md:block text-xs font-bold text-text-muted uppercase tracking-wider">Priority</div>
              <div className="col-span-4 md:col-span-2 text-xs font-bold text-text-muted uppercase tracking-wider text-right pr-8">Time</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-border/60">
              
              {/* Alert 1 */}
              <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-secondary/20 transition-colors items-center">
                <div className="col-span-8 md:col-span-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-sm">Aphids detected in Moong Field 03</h4>
                    <p className="text-xs text-text-muted font-medium mt-1">Aphid population is above threshold level.</p>
                    <button className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1">View Details <ArrowRight size={12} /></button>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded">Moong Field 03</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-danger/10 text-danger text-xs font-bold rounded">High</span>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-4 text-right">
                  <span className="text-xs font-semibold text-text-muted">1h ago</span>
                  <button className="text-text-muted hover:text-text-main"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-secondary/20 transition-colors items-center">
                <div className="col-span-8 md:col-span-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-sm">Low soil moisture in Wheat Field 01</h4>
                    <p className="text-xs text-text-muted font-medium mt-1">Soil moisture level is below optimal range.</p>
                    <button className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1">View Details <ArrowRight size={12} /></button>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded">Wheat Field 01</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-warning/10 text-warning text-xs font-bold rounded">Medium</span>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-4 text-right">
                  <span className="text-xs font-semibold text-text-muted">3h ago</span>
                  <button className="text-text-muted hover:text-text-main"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-secondary/20 transition-colors items-center">
                <div className="col-span-8 md:col-span-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-sm">Nitrogen deficiency in Rice Field 02</h4>
                    <p className="text-xs text-text-muted font-medium mt-1">Recommended to apply nitrogen fertilizer.</p>
                    <button className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1">View Details <ArrowRight size={12} /></button>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded">Rice Field 02</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-warning/10 text-warning text-xs font-bold rounded">Medium</span>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-4 text-right">
                  <span className="text-xs font-semibold text-text-muted">5h ago</span>
                  <button className="text-text-muted hover:text-text-main"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Alert 4 */}
              <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-secondary/20 transition-colors items-center">
                <div className="col-span-8 md:col-span-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-sm">Weather alert: Heavy rainfall expected</h4>
                    <p className="text-xs text-text-muted font-medium mt-1">Heavy rainfall expected in next 24 hours.</p>
                    <button className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1">View Details <ArrowRight size={12} /></button>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-secondary text-text-muted border border-border/50 text-xs font-bold rounded">All Fields</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-info/10 text-info text-xs font-bold rounded">Low</span>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-4 text-right">
                  <span className="text-xs font-semibold text-text-muted">8h ago</span>
                  <button className="text-text-muted hover:text-text-main"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Alert 5 */}
              <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-secondary/20 transition-colors items-center opacity-70">
                <div className="col-span-8 md:col-span-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-sm line-through decoration-text-muted/30">Irrigation completed</h4>
                    <p className="text-xs text-text-muted font-medium mt-1">Scheduled irrigation completed successfully.</p>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded">Wheat Field 01</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="inline-block px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded">Resolved</span>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-4 text-right">
                  <span className="text-xs font-semibold text-text-muted">Yesterday</span>
                  <button className="text-text-muted hover:text-text-main"><MoreVertical size={18} /></button>
                </div>
              </div>

            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-secondary/10">
              <span className="text-xs font-medium text-text-muted">Showing 1 to 5 of 15 alerts</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-main disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 rounded font-bold text-xs">1</button>
                <button className="w-8 h-8 flex items-center justify-center text-text-muted hover:bg-secondary rounded font-bold text-xs">2</button>
                <button className="w-8 h-8 flex items-center justify-center text-text-muted hover:bg-secondary rounded font-bold text-xs">3</button>
                <button className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-main"><ChevronRight size={16} /></button>
              </div>
            </div>

          </div>

          {/* Footer Info Banner */}
          <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 text-info items-start">
              <Info size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted font-medium mt-0.5">Alerts are generated based on AI analysis and real-time data. Always verify conditions in your field.</p>
            </div>
            <div className="text-xs font-medium text-text-muted shrink-0">
              Need help? Contact <Link to="/expert" className="font-bold text-primary hover:underline">Expert Support</Link>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Alerts Summary */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-text-main text-base mb-6">Alerts Summary</h3>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-40 h-40 mb-6">
                {/* SVG Donut Chart Placeholder */}
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray="80 20" strokeDashoffset="0"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="0 100" strokeDashoffset="-80"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="13 87" strokeDashoffset="-80"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-93"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-text-main">15</span>
                  <span className="text-[10px] font-bold text-text-main">Total</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-danger"></div><span className="text-xs font-semibold text-text-main">High</span></div><span className="text-xs font-medium text-text-muted">1 (7%)</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"></div><span className="text-xs font-semibold text-text-main">Medium</span></div><span className="text-xs font-medium text-text-muted">2 (13%)</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-info"></div><span className="text-xs font-semibold text-text-main">Low</span></div><span className="text-xs font-medium text-text-muted">0 (0%)</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div><span className="text-xs font-semibold text-text-main">Resolved</span></div><span className="text-xs font-medium text-text-muted">12 (80%)</span></div>
              </div>
            </div>

            <button className="w-full py-2.5 border border-border text-text-main rounded-lg text-xs font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2 mt-auto">
              View Alert Analytics <ArrowRight size={14} />
            </button>
          </div>

          {/* Recommended Actions */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-text-main text-base mb-4">Recommended Actions</h3>
            
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <Bug size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight">Check Moong Field 03</h4>
                    <p className="text-[10px] font-medium text-text-muted mt-0.5">Inspect aphid infestation</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                    <Droplet size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight">Irrigate Wheat Field 01</h4>
                    <p className="text-[10px] font-medium text-text-muted mt-0.5">Soil moisture is low</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                    <Leaf size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight">Add Nitrogen to Rice Field 02</h4>
                    <p className="text-[10px] font-medium text-text-muted mt-0.5">Improve plant growth</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                    <CloudRain size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight">View Weather Forecast</h4>
                    <p className="text-[10px] font-medium text-text-muted mt-0.5">Heavy rain expected</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </button>
            </div>

            <button className="w-full mt-4 py-2.5 border border-border text-text-main rounded-lg text-xs font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              View All Recommendations <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
