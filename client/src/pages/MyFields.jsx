import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MyFields = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">My Fields</h1>
        <button 
          onClick={() => navigate('/fields/add')}
          className="flex items-center gap-2 bg-text-main text-surface px-4 py-2 rounded-lg font-medium text-sm hover:bg-text-main/90 transition-colors"
        >
          <Plus size={16} /> Add New Field
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        
        {/* Wheat Field */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-semibold text-text-main">Wheat Field 01</h3>
            <p className="text-sm text-text-muted mt-1">Wheat • 1.2 ha • Day 46</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                Moderate
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/fields/stub')} 
            className="w-full mt-6 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            View Field
          </button>
        </div>

        {/* Rice Field */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-semibold text-text-main">Rice Field 02</h3>
            <p className="text-sm text-text-muted mt-1">Rice • 0.8 ha • Day 31</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                Good
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/fields/stub')} 
            className="w-full mt-6 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            View Field
          </button>
        </div>

        {/* Cotton Field */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-semibold text-text-main">Cotton Field 03</h3>
            <p className="text-sm text-text-muted mt-1">Cotton • 1.5 ha • Day 60</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                Moderate
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/fields/stub')} 
            className="w-full mt-6 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            View Field
          </button>
        </div>

        {/* Add New Field Card */}
        <div 
          onClick={() => navigate('/fields/add')}
          className="bg-background border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors min-h-[200px]"
        >
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border mb-3">
            <Plus size={20} className="text-text-main" />
          </div>
          <span className="font-medium text-text-main">Add New Field</span>
        </div>

      </div>
    </div>
  );
};
