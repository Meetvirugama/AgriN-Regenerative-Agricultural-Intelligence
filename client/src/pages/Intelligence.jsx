import React from "react";
import { 
  Leaf, 
  TrendingUp, 
  AlertTriangle, 
  ClipboardList, 
  Info,
  ChevronDown,
  Droplet,
  Bug,
  Sun,
  CloudRain,
  Wind
} from "lucide-react";

export const Intelligence = () => {
  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Intelligence Dashboard</h1>
          <p className="text-text-muted mt-1 text-sm font-medium">AI-powered insights and recommendations for your fields</p>
        </div>
        <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-secondary transition-colors shadow-sm">
          <CalendarIcon size={16} className="text-text-muted" /> 
          12 Jun - 18 Jun 2025 
          <ChevronDown size={16} className="text-text-muted" />
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex gap-4">
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <Leaf size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Total Fields</p>
            <h3 className="text-3xl font-black text-text-main mt-1">3</h3>
            <p className="text-xs text-text-muted font-medium mt-1">Active fields</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex gap-4">
          <div className="w-14 h-14 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Avg. Field Health</p>
            <h3 className="text-3xl font-black text-text-main mt-1">78%</h3>
            <p className="text-xs text-text-muted font-medium mt-1">Good</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex gap-4">
          <div className="w-14 h-14 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Active Alerts</p>
            <h3 className="text-3xl font-black text-text-main mt-1">3</h3>
            <p className="text-xs text-text-muted font-medium mt-1">Needs attention</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex gap-4">
          <div className="w-14 h-14 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center shrink-0">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Recommendations</p>
            <h3 className="text-3xl font-black text-text-main mt-1">5</h3>
            <p className="text-xs text-text-muted font-medium mt-1">This week</p>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Field Health Overview (Donut Chart placeholder) */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-text-main text-base">Field Health Overview</h3>
            <Info size={16} className="text-text-muted" />
          </div>
          
          <div className="flex-1 flex items-center justify-center gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="33 67" strokeDashoffset="0"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="33 67" strokeDashoffset="-33"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray="34 66" strokeDashoffset="-66"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-text-main">78%</span>
                <span className="text-[10px] font-bold text-text-main">Avg. Health</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between w-32"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-success"></div><span className="text-sm font-semibold text-text-main">Good</span></div><span className="text-sm font-medium text-text-muted">1 (33%)</span></div>
              <div className="flex items-center justify-between w-32"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-warning"></div><span className="text-sm font-semibold text-text-main">Moderate</span></div><span className="text-sm font-medium text-text-muted">1 (33%)</span></div>
              <div className="flex items-center justify-between w-32"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-danger"></div><span className="text-sm font-semibold text-text-main">Poor</span></div><span className="text-sm font-medium text-text-muted">1 (33%)</span></div>
            </div>
          </div>

          <button className="w-full mt-6 py-2.5 border border-border text-text-main rounded-lg text-sm font-bold hover:bg-secondary transition-colors">
            View All Fields
          </button>
        </div>

        {/* Health Trend (Line Chart placeholder) */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text-main text-base">Health Trend</h3>
              <Info size={16} className="text-text-muted" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
              All Fields <ChevronDown size={16} className="text-text-muted" />
            </button>
          </div>

          <div className="flex-1 relative min-h-[220px] w-full flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between text-xs text-text-muted font-medium pb-8 pr-12">
              <div className="border-b border-border/50 w-full text-right h-0 relative"><span className="absolute -top-2.5 -left-10">100%</span></div>
              <div className="border-b border-border/50 w-full text-right h-0 relative"><span className="absolute -top-2.5 -left-10">75%</span></div>
              <div className="border-b border-border/50 w-full text-right h-0 relative"><span className="absolute -top-2.5 -left-10">50%</span></div>
              <div className="border-b border-border/50 w-full text-right h-0 relative"><span className="absolute -top-2.5 -left-10">25%</span></div>
              <div className="border-b border-border w-full text-right h-0 relative"><span className="absolute -top-2.5 -left-10">0%</span></div>
            </div>

            <svg className="absolute inset-0 w-full h-[calc(100%-2rem)] z-10 pl-10 pr-4" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="0,50 150,20 300,30 450,20 600,40 750,15 800,20 800,200 0,200" fill="url(#trendGradient)" />
              <polyline points="0,50 150,20 300,30 450,20 600,40 750,15 800,20" fill="none" stroke="#22c55e" strokeWidth="3" />
              <circle cx="0" cy="50" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
              <circle cx="150" cy="20" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
              <circle cx="300" cy="30" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
              <circle cx="450" cy="20" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
              <circle cx="600" cy="40" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
              <circle cx="750" cy="15" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
              <circle cx="800" cy="20" r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
            </svg>

            <div className="absolute bottom-0 left-10 right-4 flex justify-between text-[11px] font-medium text-text-muted">
              <span>12 Jun</span><span>13 Jun</span><span>14 Jun</span><span>15 Jun</span><span>16 Jun</span><span>17 Jun</span><span>18 Jun</span>
            </div>
          </div>

          <div className="flex justify-center mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-success relative">
                <div className="w-2 h-2 rounded-full bg-success absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              <span className="text-sm font-bold text-text-main">Average Field Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM WIDGETS ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Top Recommendations */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-text-main text-base">Top Recommendations</h3>
            <Info size={16} className="text-text-muted" />
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex items-start justify-between pb-4 border-b border-border/50">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                  <Droplet size={18} fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Irrigate Wheat Field 01</h4>
                  <p className="text-sm text-text-muted font-medium mt-0.5">Soil moisture is low. Irrigation recommended.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">Wheat Field 01</span>
                <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded">Medium</span>
              </div>
            </div>

            <div className="flex items-start justify-between pb-4 border-b border-border/50">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                  <Leaf size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Apply Nitrogen to Rice Field 02</h4>
                  <p className="text-sm text-text-muted font-medium mt-0.5">Nitrogen levels are low. Apply urea.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">Rice Field 02</span>
                <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-1 rounded">High</span>
              </div>
            </div>

            <div className="flex items-start justify-between pb-2">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center shrink-0">
                  <Bug size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Monitor Aphids in Moong Field 03</h4>
                  <p className="text-sm text-text-muted font-medium mt-0.5">Aphids detected. Monitor closely.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">Moong Field 03</span>
                <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded">Medium</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-4 py-2.5 border border-border text-text-main rounded-lg text-sm font-bold hover:bg-secondary transition-colors">
            View All Recommendations
          </button>
        </div>

        {/* Weather Overview */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text-main text-base">Weather Overview</h3>
              <Info size={16} className="text-text-muted" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
              Madhopur, UP <ChevronDown size={16} className="text-text-muted" />
            </button>
          </div>

          <div className="flex-1 flex gap-8">
            <div className="w-1/3 flex flex-col justify-center border-r border-border/50 pr-4">
              <div className="flex items-center gap-4 mb-4">
                <Sun size={48} className="text-warning stroke-2" />
                <div>
                  <h2 className="text-4xl font-black text-text-main">32°C</h2>
                  <p className="text-base font-bold text-text-muted">Sunny</p>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center"><div className="flex gap-2 items-center text-text-muted text-sm font-bold"><Droplet size={16} /> Humidity</div><span className="font-bold text-sm">42%</span></div>
                <div className="flex justify-between items-center"><div className="flex gap-2 items-center text-text-muted text-sm font-bold"><Wind size={16} /> Wind</div><span className="font-bold text-sm">12 km/h</span></div>
              </div>
            </div>

            <div className="flex-1 flex justify-between items-center pt-2 px-2">
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-text-muted">Thu</span>
                <Sun size={24} className="text-warning" />
                <div className="text-sm font-black">33°</div>
                <div className="text-xs font-bold text-text-muted">22°</div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-text-muted">Fri</span>
                <Sun size={24} className="text-warning" />
                <div className="text-sm font-black">34°</div>
                <div className="text-xs font-bold text-text-muted">23°</div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-text-muted">Sat</span>
                <CloudRain size={24} className="text-text-muted" />
                <div className="text-sm font-black">32°</div>
                <div className="text-xs font-bold text-text-muted">22°</div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-text-muted">Sun</span>
                <CloudRain size={24} className="text-info" />
                <div className="text-sm font-black">30°</div>
                <div className="text-xs font-bold text-text-muted">21°</div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-text-muted">Mon</span>
                <Sun size={24} className="text-warning" />
                <div className="text-sm font-black">31°</div>
                <div className="text-xs font-bold text-text-muted">22°</div>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 py-2.5 border border-border text-text-main rounded-lg text-sm font-bold hover:bg-secondary transition-colors">
            View Detailed Forecast
          </button>
        </div>

      </div>
    </div>
  );
};

const CalendarIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
