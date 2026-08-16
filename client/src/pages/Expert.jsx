import React from "react";
import { 
  MessageSquare, 
  Phone, 
  Calendar, 
  Paperclip, 
  Send,
  Star,
  Check,
  ChevronRight,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";

export const Expert = () => {
  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-text-main">Expert Support</h1>
        <p className="text-text-muted mt-1 text-sm font-medium">Get help from agricultural experts</p>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-4 border-b border-border/60 pb-4">
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-success/10 text-success border border-success/20 transition-colors">
          <MessageSquare size={16} /> Live Chat
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-text-muted hover:bg-secondary border border-transparent transition-colors">
          <Phone size={16} /> Call Expert
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-text-muted hover:bg-secondary border border-transparent transition-colors">
          <Calendar size={16} /> Schedule Consultation
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content (Chat & Experts List) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Active Chat Column */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-xl shadow-sm flex flex-col h-[700px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-background rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Dr. Amit" className="w-10 h-10 rounded-full object-cover border border-border" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-main text-sm">Chat with Expert</h3>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">Online</span>
                  </div>
                  <p className="text-xs font-medium text-text-muted mt-0.5">Typically replies in 2 mins</p>
                </div>
              </div>
              <button className="text-xs font-bold text-danger hover:bg-danger/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                End Chat <span className="rotate-45 block">+</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Expert Message */}
              <div className="flex items-start gap-3">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Dr. Amit" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="max-w-[80%]">
                  <div className="bg-secondary p-4 rounded-2xl rounded-tl-sm text-sm text-text-main font-medium leading-relaxed">
                    <span className="font-bold block mb-1">Hello Ramesh! 👋</span>
                    I'm Dr. Amit Verma, your agricultural expert.<br/>
                    How can I help you today?
                  </div>
                  <span className="text-[10px] font-medium text-text-muted mt-1 block px-1">10:31 AM</span>
                </div>
              </div>

              {/* User Message */}
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-secondary text-text-main flex items-center justify-center font-bold text-sm shrink-0">R</div>
                <div className="max-w-[80%]">
                  <div className="bg-success/20 p-4 rounded-2xl rounded-tr-sm text-sm text-text-main font-semibold leading-relaxed">
                    I have brown spots on wheat leaves.<br/>
                    What should I do?
                  </div>
                  <span className="text-[10px] font-medium text-text-muted mt-1 block px-1 text-right flex items-center justify-end gap-1">
                    10:32 AM <Check size={12} className="text-success" />
                  </span>
                </div>
              </div>

              {/* Expert Message */}
              <div className="flex items-start gap-3">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Dr. Amit" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="max-w-[80%]">
                  <div className="bg-secondary p-4 rounded-2xl rounded-tl-sm text-sm text-text-main font-medium leading-relaxed">
                    Thank you for sharing the image and details.<br/>
                    This looks like <strong>Brown Spot (Bipolaris sorokiniana)</strong>.<br/><br/>
                    I recommend applying Propiconazole 25% EC.<br/>
                    Would you like more detailed treatment steps?
                  </div>
                  <span className="text-[10px] font-medium text-text-muted mt-1 block px-1">10:33 AM</span>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border/50 bg-background rounded-b-xl">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                <button className="shrink-0 px-4 py-1.5 border border-success/30 text-success bg-success/5 rounded-full text-xs font-bold hover:bg-success/10 transition-colors">Yes, show details</button>
                <button className="shrink-0 px-4 py-1.5 border border-success/30 text-success bg-success/5 rounded-full text-xs font-bold hover:bg-success/10 transition-colors">Share product options</button>
                <button className="shrink-0 px-4 py-1.5 border border-success/30 text-success bg-success/5 rounded-full text-xs font-bold hover:bg-success/10 transition-colors">Preventive measures</button>
                <button className="shrink-0 px-4 py-1.5 border border-success/30 text-success bg-success/5 rounded-full text-xs font-bold hover:bg-success/10 transition-colors">Thanks!</button>
              </div>
              <div className="relative flex items-center bg-surface border border-border rounded-xl px-2 focus-within:border-success focus-within:ring-1 focus-within:ring-success transition-all shadow-sm">
                <button className="p-2 text-text-muted hover:bg-secondary rounded-lg transition-colors"><Paperclip size={18} /></button>
                <input type="text" placeholder="Type your message..." className="flex-1 bg-transparent border-none focus:outline-none py-3 px-2 text-sm" />
                <button className="w-9 h-9 bg-success text-surface rounded-lg flex items-center justify-center hover:bg-success/90 transition-colors shadow-sm ml-2">
                  <Send size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Available Experts Column */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-text-main text-base">Available Experts</h3>
              <button className="text-xs font-bold text-success hover:underline">View All</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className="flex gap-3 items-center">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Expert" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-main">Dr. Amit Verma</h4>
                      <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">Online</span>
                    </div>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">Plant Pathologist</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-text-main">
                      <Star size={10} className="text-warning fill-warning" /> 4.8 <span className="text-text-muted font-medium">(320)</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors">Chat</button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className="flex gap-3 items-center">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80" alt="Expert" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Dr. Neha Sharma</h4>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">Soil Scientist</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-text-main">
                      <Star size={10} className="text-warning fill-warning" /> 4.7 <span className="text-text-muted font-medium">(245)</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors">Chat</button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className="flex gap-3 items-center">
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" alt="Expert" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Dr. Rajesh Kumar</h4>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">Agronomist</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-text-main">
                      <Star size={10} className="text-warning fill-warning" /> 4.6 <span className="text-text-muted font-medium">(198)</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors">Chat</button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className="flex gap-3 items-center">
                  <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80" alt="Expert" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Dr. Priya Singh</h4>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">Entomologist</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-text-main">
                      <Star size={10} className="text-warning fill-warning" /> 4.7 <span className="text-text-muted font-medium">(186)</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors">Chat</button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className="flex gap-3 items-center">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" alt="Expert" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Dr. Sandeep Yadav</h4>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">Irrigation Specialist</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-text-main">
                      <Star size={10} className="text-warning fill-warning" /> 4.6 <span className="text-text-muted font-medium">(142)</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/5 transition-colors">Chat</button>
              </div>

            </div>

            <button className="w-full mt-4 py-2.5 border border-border text-text-main rounded-lg text-sm font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2 shrink-0">
              View All Experts <ChevronRight size={16} />
            </button>
          </div>

        </div>

        {/* Right Sidebar Widgets */}
        <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
          
          {/* Schedule Consultation Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-success" />
              <h3 className="font-bold text-text-main text-sm">Schedule Consultation</h3>
            </div>
            <p className="text-xs font-medium text-text-muted mb-4">Book a 1-on-1 consultation</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <Check size={14} className="text-success shrink-0" /> Detailed field discussion
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <Check size={14} className="text-success shrink-0" /> Personalized solutions
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <Check size={14} className="text-success shrink-0" /> Follow-up support
              </div>
            </div>

            <button className="w-full py-2.5 bg-[#14532d] text-surface rounded-lg text-sm font-bold hover:bg-[#14532d]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
              Book Now <ChevronRight size={16} />
            </button>
          </div>

          {/* Call Expert Now Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={20} className="text-success" />
              <h3 className="font-bold text-text-main text-sm">Call Expert Now</h3>
            </div>
            <p className="text-xs font-medium text-text-muted mb-4">Talk to expert instantly</p>
            
            <button className="w-full py-2.5 border border-success text-success bg-success/5 rounded-lg text-base font-bold hover:bg-success/10 transition-colors shadow-sm mb-2">
              +91 1800 123 4567
            </button>
            <p className="text-center text-xs font-semibold text-text-muted">Available: 9 AM - 6 PM</p>
          </div>

          {/* Top Help Topics */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-main text-sm mb-4">Top Help Topics</h3>
            
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between py-3 hover:px-2 rounded-lg transition-all group border-b border-border/50">
                <span className="text-sm font-semibold text-text-main group-hover:text-success transition-colors">Disease Identification</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="w-full flex items-center justify-between py-3 hover:px-2 rounded-lg transition-all group border-b border-border/50">
                <span className="text-sm font-semibold text-text-main group-hover:text-success transition-colors">Pest Management</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="w-full flex items-center justify-between py-3 hover:px-2 rounded-lg transition-all group border-b border-border/50">
                <span className="text-sm font-semibold text-text-main group-hover:text-success transition-colors">Soil Health</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="w-full flex items-center justify-between py-3 hover:px-2 rounded-lg transition-all group border-b border-border/50">
                <span className="text-sm font-semibold text-text-main group-hover:text-success transition-colors">Fertilizer Recommendations</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              <button className="w-full flex items-center justify-between py-3 hover:px-2 rounded-lg transition-all group border-b border-border/50">
                <span className="text-sm font-semibold text-text-main group-hover:text-success transition-colors">Irrigation Management</span>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            </div>

            <button className="text-xs font-bold text-success hover:underline mt-4 flex items-center gap-1">
              View All Topics <ChevronRight size={12} />
            </button>
          </div>

        </div>

      </div>

      {/* Bottom Area: History & Info Banner */}
      <div className="space-y-6 pt-4">
        
        {/* Support History Table */}
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-6 min-w-[800px]">
            <h3 className="font-bold text-text-main text-base">Your Support History</h3>
            <button className="text-xs font-bold text-success hover:underline">View All</button>
          </div>

          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-border/60">
              <div className="col-span-3 text-xs font-bold text-text-muted uppercase tracking-wider">Date & Time</div>
              <div className="col-span-4 text-xs font-bold text-text-muted uppercase tracking-wider">Topic</div>
              <div className="col-span-2 text-xs font-bold text-text-muted uppercase tracking-wider">Expert</div>
              <div className="col-span-1 text-xs font-bold text-text-muted uppercase tracking-wider">Type</div>
              <div className="col-span-2 text-xs font-bold text-text-muted uppercase tracking-wider">Status</div>
            </div>

            <div className="grid grid-cols-12 gap-4 py-4 border-b border-border/60 hover:bg-secondary/20 transition-colors items-center cursor-pointer group">
              <div className="col-span-3 text-xs font-semibold text-text-main">17 Jun 2025, 04:15 PM</div>
              <div className="col-span-4 text-sm font-bold text-text-main group-hover:text-success transition-colors">Rice yellow leaf problem</div>
              <div className="col-span-2 text-xs font-medium text-text-muted">Dr. Neha Sharma</div>
              <div className="col-span-1"><span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded">Chat</span></div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded">Resolved</span>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info Banner */}
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex gap-3 text-success items-center">
          <Info size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-success/90">Our experts provide guidance based on the information you share. Please consult local agricultural experts for final recommendations.</p>
        </div>

      </div>

    </div>
  );
};
