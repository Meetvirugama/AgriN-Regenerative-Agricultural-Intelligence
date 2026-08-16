import React from "react";
import { 
  Plus, 
  CloudRain, 
  AlertTriangle, 
  Mic, 
  MoreVertical,
  Info,
  Droplets,
  MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      {/* HEADER */}
      <section>
        <h1 className="text-3xl font-bold text-text-main">Good morning, Ramesh</h1>
        <p className="text-text-muted mt-1 text-lg">Here's what's happening in your fields today.</p>
      </section>

      {/* MY FIELDS & TODAY'S RECOMMENDATION ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* MY FIELDS (Spans 2 columns) */}
        <section className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main">My Fields</h2>
            <Link to="/fields" className="text-sm font-semibold text-primary hover:underline">View All Fields</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Wheat Field */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border/50">
                    <img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop" alt="Wheat" className="w-full h-full object-cover" />
                  </div>
                  <button className="text-text-muted hover:text-text-main">
                    <MoreVertical size={20} />
                  </button>
                </div>
                <h3 className="font-bold text-text-main text-lg">Wheat Field 01</h3>
                <p className="text-sm text-text-muted mt-0.5">Wheat • 1.2 ha • Day 46</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-warning/10 text-warning">
                    Moderate
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/fields/stub')} 
                className="w-full mt-6 py-2.5 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
              >
                View Field
              </button>
            </div>

            {/* Rice Field */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border/50">
                    <img src="https://images.unsplash.com/photo-1593414902194-e34346bbdbf9?w=150&h=150&fit=crop" alt="Rice" className="w-full h-full object-cover" />
                  </div>
                  <button className="text-text-muted hover:text-text-main">
                    <MoreVertical size={20} />
                  </button>
                </div>
                <h3 className="font-bold text-text-main text-lg">Rice Field 02</h3>
                <p className="text-sm text-text-muted mt-0.5">Rice • 0.8 ha • Day 31</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-success/10 text-success">
                    Good
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/fields/stub')} 
                className="w-full mt-6 py-2.5 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
              >
                View Field
              </button>
            </div>

            {/* Add New Field Card */}
            <div 
              onClick={() => navigate('/fields/add')}
              className="bg-background border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors min-h-[220px]"
            >
              <div className="text-text-main mb-2">
                <Plus size={28} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-text-main">Add New Field</span>
            </div>

          </div>
        </section>

        {/* TODAY'S RECOMMENDATION (Spans 1 column) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text-main">Today's Recommendation</h2>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm min-h-[220px] flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="mt-1">
                <CloudRain size={40} className="text-text-muted stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-bold text-text-main text-base leading-tight">Rain expected in 2 days.</h3>
                <p className="font-medium text-text-main mt-1">Hold irrigation for now.</p>
                <p className="text-sm text-text-muted mt-4">Field: Wheat Field 01</p>
              </div>
            </div>
            <button className="w-full py-2.5 mt-4 border border-border text-text-main rounded-lg text-sm font-bold hover:bg-secondary transition-colors">
              View Details
            </button>
          </div>
        </section>
      </div>

      {/* RECENT ALERTS & QUICK ASK ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        
        {/* ALERTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main">Recent Alerts</h2>
            <Link to="/alerts" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>
          <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col">
            
            {/* Alert 1 */}
            <div className="p-4 flex items-center justify-between border-b border-border hover:bg-background/50 transition-colors">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning/10 text-warning shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Rain expected in 2 days</h4>
                  <p className="text-sm text-text-muted mt-0.5">Wheat Field 01</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-warning/10 text-warning">Medium</span>
                <span className="text-xs text-text-muted font-medium w-12 text-right">1h ago</span>
              </div>
            </div>

            {/* Alert 2 */}
            <div className="p-4 flex items-center justify-between border-b border-border hover:bg-background/50 transition-colors">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-danger/10 text-danger shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Disease risk increasing</h4>
                  <p className="text-sm text-text-muted mt-0.5">Rice Field 02</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-danger/10 text-danger">High</span>
                <span className="text-xs text-text-muted font-medium w-12 text-right">2h ago</span>
              </div>
            </div>

            {/* Alert 3 */}
            <div className="p-4 flex items-center justify-between border-b border-border hover:bg-background/50 transition-colors">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success/10 text-success shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Satellite: Vegetation improving</h4>
                  <p className="text-sm text-text-muted mt-0.5">Cotton Field 03</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-success/10 text-success">Low</span>
                <span className="text-xs text-text-muted font-medium w-12 text-right">3h ago</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 flex justify-center border-t border-border bg-background/50 rounded-b-xl">
              <button className="text-sm font-bold text-primary hover:underline">
                View All Alerts
              </button>
            </div>
          </div>
        </section>

        {/* QUICK ASK */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text-main">Quick Ask</h2>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm h-full max-h-[290px] flex flex-col">
            <div className="relative flex-1">
              <textarea 
                placeholder="Ask AgriMesh anything about your field..."
                className="w-full border border-border rounded-xl p-4 pr-14 resize-none h-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-background/50"
              ></textarea>
              <button className="absolute right-3 top-3 p-2.5 text-text-muted hover:text-primary transition-colors bg-surface rounded-lg shadow-sm border border-border">
                <Mic size={20} />
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-8 py-3 bg-text-main text-surface font-bold rounded-lg text-sm hover:bg-text-main/90 transition-colors">
                Ask
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Total Fields</p>
            <h3 className="text-2xl font-black text-text-main mt-1">3</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Fields Need Attention</p>
            <h3 className="text-2xl font-black text-text-main mt-1">1</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Active Alerts</p>
            <h3 className="text-2xl font-black text-text-main mt-1">3</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Expert Responses</p>
            <p className="text-xs text-text-muted">This Month</p>
            <h3 className="text-2xl font-black text-text-main mt-0.5">2</h3>
          </div>
        </div>
      </div>

    </div>
  );
};
