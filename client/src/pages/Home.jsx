import React from "react";
import { Plus, CloudRain, AlertTriangle, CloudLightning, Mic, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      {/* HEADER */}
      <section>
        <h1 className="text-3xl font-bold text-text-main">Good morning, Ramesh</h1>
        <p className="text-text-muted mt-1">Here's what's happening in your fields today.</p>
      </section>

      {/* MY FIELDS & TODAY'S RECOMMENDATION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MY FIELDS (Spans 2 columns) */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-main">My Fields</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
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
        </section>

        {/* TODAY'S RECOMMENDATION (Spans 1 column) */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-main">Today's Recommendation</h2>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm h-[200px] flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="mt-1">
                <CloudRain size={28} className="text-info" />
              </div>
              <div>
                <h3 className="font-medium text-text-main">Rain expected in 2 days.</h3>
                <p className="text-sm text-text-muted mt-1">Hold irrigation for now.</p>
                <p className="text-xs text-text-muted mt-3">Field: Wheat Field 01</p>
              </div>
            </div>
            <button className="w-full py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
              View Details
            </button>
          </div>
        </section>
      </div>

      {/* RECENT ALERTS & QUICK ASK ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* ALERTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-main">Recent Alerts</h2>
            <Link to="/alerts" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 flex gap-4 items-start shadow-sm hover:border-warning/50 transition-colors">
              <AlertTriangle size={20} className="text-warning shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Rain expected in 2 days</h4>
                <p className="text-xs text-text-muted">Wheat Field 01</p>
                <span className="inline-block mt-2 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">Medium</span>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 flex gap-4 items-start shadow-sm hover:border-danger/50 transition-colors">
              <CloudLightning size={20} className="text-danger shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Disease risk increasing</h4>
                <p className="text-xs text-text-muted">Rice Field 02</p>
                <span className="inline-block mt-2 text-xs font-medium text-danger bg-danger/10 px-2 py-0.5 rounded">High</span>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ASK */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-main">Quick Ask</h2>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="relative">
              <textarea 
                placeholder="Ask AgriMesh anything about your field..."
                className="w-full border border-border rounded-lg p-4 pr-12 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-background"
              ></textarea>
              <button className="absolute right-3 bottom-3 p-2 text-text-muted hover:text-primary transition-colors bg-surface rounded-full shadow-sm border border-border">
                <Mic size={18} />
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-6 py-2 bg-text-main text-surface font-semibold rounded-lg text-sm hover:bg-text-main/90 transition-colors">
                Ask
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
