import React, { useState } from "react";
import { 
  Plus, 
  MoreVertical, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Leaf, 
  Droplets, 
  CloudRain, 
  Activity 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MyFields = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main">My Fields</h1>
          <p className="text-text-muted mt-1 text-sm font-medium">Manage and monitor all your fields from here.</p>
        </div>
        <button 
          onClick={() => navigate('/fields/add')}
          className="flex items-center gap-2 bg-text-main text-surface px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-text-main/90 active:scale-[0.98] transition-all"
        >
          <Plus size={18} strokeWidth={2.5} /> Add New Field
        </button>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold text-text-main hover:bg-secondary transition-colors">
            All Fields <ChevronDown size={16} className="text-text-muted" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold text-text-main hover:bg-secondary transition-colors">
            Sort by: Recent <ChevronDown size={16} className="text-text-muted" />
          </button>
        </div>
        
        <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${viewMode === "grid" ? "text-primary bg-primary/10" : "text-text-muted hover:bg-secondary"}`}
          >
            <LayoutGrid size={20} />
          </button>
          <div className="w-px h-6 bg-border"></div>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${viewMode === "list" ? "text-primary bg-primary/10" : "text-text-muted hover:bg-secondary"}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* FIELD CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
        
        {/* Wheat Field 01 */}
        <div className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          {/* Header Section */}
          <div className="p-5 flex gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
              <img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop" alt="Wheat" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-text-main text-base truncate">Wheat Field 01</h3>
                <button className="text-text-muted hover:text-text-main shrink-0">
                  <MoreVertical size={18} />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1 truncate">Wheat • Variety X</p>
              <p className="text-xs text-text-muted truncate">1.2 ha • Day 46</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-warning/10 text-warning">
                  Moderate
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-border/60"></div>
          
          {/* Stats Section */}
          <div className="p-5 space-y-3 flex-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Leaf size={14} className="text-text-muted" /> Growth Stage
              </div>
              <span className="font-semibold text-primary">Flowering</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Droplets size={14} className="text-text-muted" /> Irrigation
              </div>
              <span className="font-semibold text-text-main">Next in 2 days</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <CloudRain size={14} className="text-text-muted" /> Last Rain
              </div>
              <span className="font-semibold text-text-main">2 days ago</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Activity size={14} className="text-text-muted" /> Field Health
              </div>
              <span className="font-bold text-warning">60%</span>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-5 pt-0 mt-auto">
            <button 
              onClick={() => navigate('/fields/stub')} 
              className="w-full py-2.5 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
            >
              View Field
            </button>
          </div>
        </div>

        {/* Rice Field 02 */}
        <div className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          {/* Header Section */}
          <div className="p-5 flex gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
              <img src="https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop" alt="Rice" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-text-main text-base truncate">Rice Field 02</h3>
                <button className="text-text-muted hover:text-text-main shrink-0">
                  <MoreVertical size={18} />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1 truncate">Rice • Variety J</p>
              <p className="text-xs text-text-muted truncate">0.8 ha • Day 31</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-success/10 text-success">
                  Good
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-border/60"></div>
          
          {/* Stats Section */}
          <div className="p-5 space-y-3 flex-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Leaf size={14} className="text-text-muted" /> Growth Stage
              </div>
              <span className="font-semibold text-primary">Tillering</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Droplets size={14} className="text-text-muted" /> Irrigation
              </div>
              <span className="font-semibold text-text-main">Not needed</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <CloudRain size={14} className="text-text-muted" /> Last Rain
              </div>
              <span className="font-semibold text-text-main">3 days ago</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Activity size={14} className="text-text-muted" /> Field Health
              </div>
              <span className="font-bold text-primary">78%</span>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-5 pt-0 mt-auto">
            <button 
              onClick={() => navigate('/fields/stub')} 
              className="w-full py-2.5 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
            >
              View Field
            </button>
          </div>
        </div>

        {/* Cotton Field 03 */}
        <div className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          {/* Header Section */}
          <div className="p-5 flex gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
              <img src="https://images.unsplash.com/photo-1596767512130-101153bcad5e?w=150&h=150&fit=crop" alt="Cotton" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-text-main text-base truncate">Cotton Field 03</h3>
                <button className="text-text-muted hover:text-text-main shrink-0">
                  <MoreVertical size={18} />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1 truncate">Cotton • Variety MCU 5</p>
              <p className="text-xs text-text-muted truncate">1.5 ha • Day 60</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-warning/10 text-warning">
                  Moderate
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-border/60"></div>
          
          {/* Stats Section */}
          <div className="p-5 space-y-3 flex-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Leaf size={14} className="text-text-muted" /> Growth Stage
              </div>
              <span className="font-semibold text-primary">Budding</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Droplets size={14} className="text-text-muted" /> Irrigation
              </div>
              <span className="font-semibold text-text-main">Tomorrow</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <CloudRain size={14} className="text-text-muted" /> Last Rain
              </div>
              <span className="font-semibold text-text-main">1 day ago</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <Activity size={14} className="text-text-muted" /> Field Health
              </div>
              <span className="font-bold text-warning">55%</span>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-5 pt-0 mt-auto">
            <button 
              onClick={() => navigate('/fields/stub')} 
              className="w-full py-2.5 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
            >
              View Field
            </button>
          </div>
        </div>

        {/* Add New Field Card */}
        <div 
          onClick={() => navigate('/fields/add')}
          className="bg-background border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors min-h-[400px]"
        >
          <div className="text-text-main mb-3">
            <Plus size={36} strokeWidth={2} />
          </div>
          <span className="font-bold text-text-main">Add New Field</span>
        </div>

      </div>

      {/* BOTTOM BANNER */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mt-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-12 bg-surface rounded-lg border border-border/50 flex items-center justify-center text-2xl shadow-sm shrink-0">
            🏞️
          </div>
          <div>
            <h3 className="font-bold text-text-main text-lg">Add more fields to get better insights</h3>
            <p className="text-sm text-text-muted mt-1 font-medium">The more fields you add, the smarter AgriMesh becomes.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/fields/add')}
          className="shrink-0 px-6 py-2.5 border border-primary bg-surface text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
        >
          Add New Field
        </button>
      </div>

    </div>
  );
};
