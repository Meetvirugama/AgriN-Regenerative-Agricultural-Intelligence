import React from "react";
import { 
  Leaf, 
  Bug, 
  BookOpen, 
  CloudSun, 
  BarChart2, 
  Tag, 
  Paperclip, 
  Send,
  Zap,
  Search,
  Sprout,
  Droplet,
  Calculator,
  MessageSquare,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const Ask = () => {
  return (
    <div className="animate-fade-in-up flex flex-col h-full min-h-[calc(100vh-8rem)]">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main">Ask AgriMesh</h1>
        <p className="text-text-muted mt-1 text-sm font-medium">Your AI farming assistant for expert advice and insights</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Main Chat UI) */}
        <div className="xl:col-span-2 flex flex-col h-full">
          
          <div className="flex-1 flex flex-col justify-center mb-8">
            {/* Greeting */}
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 relative">
                <Leaf size={32} />
                <Sparkles size={16} className="absolute top-3 right-3 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-1">Hello Ramesh! 👋</h2>
              <p className="text-text-muted font-medium">How can I help you today?</p>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main mb-1">Crop Management</h3>
                    <p className="text-xs text-text-muted font-medium">Get advice on crop care, irrigation, and best practices.</p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                    <Bug size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main mb-1">Pest & Disease</h3>
                    <p className="text-xs text-text-muted font-medium">Identify and manage pests and diseases.</p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main mb-1">Fertilizer Guide</h3>
                    <p className="text-xs text-text-muted font-medium">Find the right fertilizers and application timing.</p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                    <CloudSun size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main mb-1">Weather & Alerts</h3>
                    <p className="text-xs text-text-muted font-medium">Check weather updates and agri advisories.</p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <BarChart2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main mb-1">Field Insights</h3>
                    <p className="text-xs text-text-muted font-medium">Get AI insights about your fields.</p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main mb-1">Market Prices</h3>
                    <p className="text-xs text-text-muted font-medium">Check latest market prices for your crops.</p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>

            </div>

            {/* Suggestions */}
            <div>
              <p className="text-sm font-semibold text-text-main mb-3">Try asking something like:</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-success/5 hover:bg-success/10 border border-success/20 text-success rounded-full text-xs font-bold transition-colors">
                  How to control aphids in moong?
                </button>
                <button className="px-4 py-2 bg-success/5 hover:bg-success/10 border border-success/20 text-success rounded-full text-xs font-bold transition-colors">
                  When should I irrigate wheat?
                </button>
                <button className="px-4 py-2 bg-success/5 hover:bg-success/10 border border-success/20 text-success rounded-full text-xs font-bold transition-colors">
                  Best fertilizer for rice crop
                </button>
                <button className="px-4 py-2 bg-success/5 hover:bg-success/10 border border-success/20 text-success rounded-full text-xs font-bold transition-colors">
                  Weather forecast for next 5 days
                </button>
              </div>
            </div>
          </div>

          {/* Chat Input Area */}
          <div className="mt-auto shrink-0">
            <div className="bg-surface border border-border rounded-xl p-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all flex flex-col">
              <textarea 
                placeholder="Type your question here..." 
                className="w-full bg-transparent resize-none outline-none p-3 text-sm min-h-[60px]"
              />
              <div className="flex items-center justify-between p-2">
                <button className="p-2 text-text-muted hover:bg-secondary rounded-lg transition-colors">
                  <Paperclip size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-text-muted">0/1000</span>
                  <button className="w-10 h-10 bg-primary text-surface rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm">
                    <Send size={18} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-text-muted mt-3 font-medium">
              AgriMesh AI provides general guidance. Please consult local experts for specific recommendations.
            </p>
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-success fill-success" />
              <h3 className="font-bold text-success text-sm">Quick Actions</h3>
            </div>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <Search size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">Diagnose Crop Problem</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-text-main flex items-center justify-center shrink-0 border border-border/50">
                    <Sprout size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">Soil Health Check</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                    <Droplet size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">Irrigation Scheduler</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-text-main flex items-center justify-center shrink-0 border border-border/50">
                    <Calculator size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">Profitability Calculator</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-success" />
                <h3 className="font-bold text-success text-sm">Recent Conversations</h3>
              </div>
              <button className="text-xs font-bold text-success hover:underline">View All</button>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between group cursor-pointer border-b border-border/50 pb-4">
                <div className="pr-4 overflow-hidden">
                  <h4 className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">How to improve wheat yield?</h4>
                  <p className="text-xs font-medium text-text-muted truncate mt-1">AI: To improve wheat yield, ensure...</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-text-muted">
                  <span className="text-xs font-medium">2h ago</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="flex items-center justify-between group cursor-pointer border-b border-border/50 pb-4">
                <div className="pr-4 overflow-hidden">
                  <h4 className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">Rice yellow leaf problem</h4>
                  <p className="text-xs font-medium text-text-muted truncate mt-1">AI: Yellow leaves in rice can be...</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-text-muted">
                  <span className="text-xs font-medium">1d ago</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="flex items-center justify-between group cursor-pointer">
                <div className="pr-4 overflow-hidden">
                  <h4 className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">Best time to sow moong?</h4>
                  <p className="text-xs font-medium text-text-muted truncate mt-1">AI: Moong is best sown between...</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-text-muted">
                  <span className="text-xs font-medium">2d ago</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
