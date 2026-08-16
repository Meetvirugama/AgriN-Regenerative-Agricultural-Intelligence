import React, { useState } from "react";
import { 
  ArrowLeft, Search, Crosshair, MapPin, Info, Satellite, CloudRain, 
  Map as MapIcon, Plus, Minus, Check, MousePointer2, PenTool, Edit3, 
  Trash2, Navigation, Calendar, Droplet, Triangle, CloudUpload, 
  BrainCircuit, Lightbulb, Tag, Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AddFieldWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State for Step 3
  const [formData, setFormData] = useState({
    name: "Wheat Field 01",
    crop: "Wheat",
    variety: "Variety X",
    date: "12 Jun 2025",
    area: "1.25 ha",
    irrigation: "Tube Well",
    soil: "Loamy Soil",
    description: "Good productivity field. Regular irrigation."
  });

  return (
    <div className="animate-fade-in-up flex flex-col h-[calc(100vh-6rem)]">
      
      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full overflow-y-auto pb-8">
        
        {/* HEADER */}
        <div className="relative flex items-center justify-center mb-8 shrink-0 pt-4">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="absolute left-0 flex items-center gap-2 text-sm font-bold text-text-main hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold text-text-main">Add New Field</h1>
        </div>
        
        {/* STEPPER */}
        <div className="flex items-center justify-center gap-4 mb-10 w-full max-w-3xl mx-auto shrink-0">
          <StepIndicator active={step >= 1} current={step === 1} completed={step > 1} num={1} label="Location" />
          <div className={`flex-1 h-px max-w-[80px] ${step > 1 ? 'bg-primary' : 'bg-border'}`}></div>
          <StepIndicator active={step >= 2} current={step === 2} completed={step > 2} num={2} label="Boundary" />
          <div className={`flex-1 h-px max-w-[80px] ${step > 2 ? 'bg-primary' : 'bg-border'}`}></div>
          <StepIndicator active={step >= 3} current={step === 3} completed={step > 3} num={3} label="Details" />
          <div className={`flex-1 h-px max-w-[80px] ${step > 3 ? 'bg-primary' : 'bg-border'}`}></div>
          <StepIndicator active={step >= 4} current={step === 4} completed={step > 4} num={4} label="Confirm" />
        </div>

        {/* STEP 1: LOCATION */}
        {step === 1 && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Map & Search) */}
            <div className="lg:col-span-2 flex flex-col h-[600px] space-y-4">
              <div>
                <h2 className="text-xl font-bold text-text-main">Step 1: Location</h2>
                <p className="text-sm font-medium text-text-muted mt-1">Search or select your field location</p>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search location..." 
                    className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <button className="w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center text-text-main hover:bg-secondary transition-colors shadow-sm shrink-0">
                  <Crosshair size={20} />
                </button>
              </div>

              <div className="flex-1 bg-[#f0f3f4] relative rounded-xl border border-border overflow-hidden">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200" alt="Map" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary text-surface rounded-full flex items-center justify-center shadow-lg"><MapPin size={24} fill="currentColor" className="text-primary-content" /></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full mt-1"></div>
                </div>
                <div className="absolute bottom-4 right-4 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
                  <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary border-b border-border"><Plus size={20} /></button>
                  <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary"><Minus size={20} /></button>
                </div>
              </div>

              <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex gap-3 text-info items-start">
                <Info size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-text-main">Tips</h4>
                  <p className="text-sm text-text-muted mt-0.5">Zoom in and tap on the exact location of your field.</p>
                </div>
              </div>
            </div>

            {/* Right Column (Info Panel) */}
            <div className="flex flex-col h-[600px] justify-between">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-text-main text-base mb-6">Why Location is Important?</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4"><div className="text-primary mt-0.5 shrink-0"><Satellite size={24} strokeWidth={1.5} /></div><p className="text-sm text-text-muted font-medium">Helps us get accurate satellite data</p></div>
                  <div className="flex items-start gap-4"><div className="text-primary mt-0.5 shrink-0"><CloudRain size={24} strokeWidth={1.5} /></div><p className="text-sm text-text-muted font-medium">Provides precise weather forecasts</p></div>
                  <div className="flex items-start gap-4"><div className="text-primary mt-0.5 shrink-0"><MapIcon size={24} strokeWidth={1.5} /></div><p className="text-sm text-text-muted font-medium">Enables field-specific recommendations</p></div>
                </div>
                <div className="w-full h-px bg-border my-8"></div>
                <h3 className="font-bold text-text-main text-base mb-4">Selected Location</h3>
                <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-success shrink-0"><MapPin size={24} fill="currentColor" className="text-success-content" /></div>
                    <div><p className="text-sm font-bold text-text-main">Madhopur, Uttar Pradesh, India</p><p className="text-xs text-text-muted mt-0.5">29.7310° N, 78.2650° E</p></div>
                  </div>
                  <button className="text-sm font-bold text-info hover:underline shrink-0 pl-2">Change</button>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => navigate('/fields')} className="px-8 py-3 bg-surface border border-border text-text-main font-bold rounded-lg text-sm hover:bg-secondary transition-colors">Cancel</button>
                <button onClick={() => setStep(2)} className="px-10 py-3 bg-text-main text-surface font-bold rounded-lg text-sm hover:bg-text-main/90 transition-colors shadow-md">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BOUNDARY */}
        {step === 2 && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 flex flex-col h-[650px] space-y-4">
              
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold text-text-main">Step 2: Draw Field Boundary</h2>
                  <p className="text-sm font-medium text-text-muted mt-1">Mark the exact boundary of your field on the map</p>
                </div>
                <div className="bg-info/10 text-info px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-info/20">
                  <Info size={16} /> Draw the boundary as close as possible for accurate insights
                </div>
              </div>

              <div className="flex-1 relative rounded-xl border border-border overflow-hidden">
                {/* Satellite Map */}
                <img src="https://images.unsplash.com/photo-1595180436402-2ebde09a32c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Satellite" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Faux Polygon */}
                <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points="35,45 55,50 62,75 30,70" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" strokeWidth="0.5" />
                  <circle cx="35" cy="45" r="1.5" fill="white" stroke="#22c55e" strokeWidth="0.5" />
                  <circle cx="55" cy="50" r="1.5" fill="white" stroke="#22c55e" strokeWidth="0.5" />
                  <circle cx="62" cy="75" r="1.5" fill="white" stroke="#22c55e" strokeWidth="0.5" />
                  <circle cx="30" cy="70" r="1.5" fill="white" stroke="#22c55e" strokeWidth="0.5" />
                </svg>

                {/* Map Overlay Controls */}
                <div className="absolute top-4 left-4 bg-surface rounded-lg shadow-sm border border-border flex overflow-hidden z-20">
                  <button className="px-4 py-2 text-sm font-semibold text-text-muted hover:bg-secondary">Map</button>
                  <button className="px-4 py-2 text-sm font-bold bg-background text-text-main shadow-sm border-l border-border">Satellite</button>
                </div>

                <div className="absolute top-4 right-4 z-20">
                  <div className="relative w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" placeholder="Search location" className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none shadow-sm" />
                  </div>
                </div>

                {/* Drawing Toolbar */}
                <div className="absolute top-16 left-4 bg-surface rounded-xl shadow-lg border border-border flex flex-col p-2 gap-2 z-20">
                  <button className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary font-semibold text-xs gap-1 border border-primary/20"><MousePointer2 size={18} /> Select</button>
                  <button className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-text-muted hover:bg-secondary hover:text-text-main font-semibold text-xs gap-1 transition-colors"><PenTool size={18} /> Draw</button>
                  <button className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-text-muted hover:bg-secondary hover:text-text-main font-semibold text-xs gap-1 transition-colors"><Edit3 size={18} /> Edit</button>
                  <button className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-text-muted hover:bg-secondary hover:text-text-main font-semibold text-xs gap-1 transition-colors"><Trash2 size={18} /> Clear</button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-4 left-4 bg-surface rounded-lg shadow-lg border border-border p-2 z-20">
                  <Navigation size={20} className="text-text-main" />
                </div>
                <div className="absolute bottom-4 right-4 flex flex-col bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20">
                  <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary border-b border-border"><Plus size={20} /></button>
                  <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary"><Minus size={20} /></button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col h-[650px] justify-between xl:pt-14">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                <p className="text-sm font-bold text-text-main">Field Area</p>
                <h3 className="text-3xl font-black text-text-main mt-1">1.23 Hectares</h3>
                <p className="text-xs font-medium text-text-muted mt-1">(12,300 m²)</p>

                <div className="mt-6 mb-6 p-4 border border-border rounded-xl bg-background flex items-center justify-center h-32 relative">
                  {/* Grid background */}
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                  <svg className="w-full h-full z-10" viewBox="0 0 100 100">
                    <polygon points="30,40 70,40 85,70 20,80" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="30" cy="40" r="2" fill="white" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="70" cy="40" r="2" fill="white" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="85" cy="70" r="2" fill="white" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="20" cy="80" r="2" fill="white" stroke="#22c55e" strokeWidth="1" />
                  </svg>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-text-muted text-sm font-medium"><MapPin size={16} /> Perimeter</div><span className="font-bold text-sm">462 m</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-text-muted text-sm font-medium"><MapPin size={16} /> Latitude</div><span className="font-bold text-sm">23.0225° N</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-text-muted text-sm font-medium"><MapPin size={16} /> Longitude</div><span className="font-bold text-sm">72.5714° E</span></div>
                </div>

                <div className="mt-6 bg-success/5 border border-success/20 rounded-xl p-4">
                  <h4 className="font-bold text-sm text-text-main mb-3">Boundary Tips</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-success"><Check size={16} /> Include your whole field area</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-success"><Check size={16} /> Avoid including nearby roads/houses</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-success"><Check size={16} /> You can adjust points anytime</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setStep(1)} className="px-8 py-3 bg-surface border border-border text-text-main font-bold rounded-lg text-sm hover:bg-secondary transition-colors">Previous</button>
                <button onClick={() => setStep(3)} className="px-10 py-3 bg-text-main text-surface font-bold rounded-lg text-sm hover:bg-text-main/90 transition-colors shadow-md">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column (Form) */}
            <div className="xl:col-span-2 flex flex-col">
              <div>
                <h2 className="text-xl font-bold text-text-main">Step 3: Field Details</h2>
                <p className="text-sm font-medium text-text-muted mt-1">Provide basic information about your field</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Field Name <span className="text-danger">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Crop Type <span className="text-danger">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-warning"><Leaf size={18} /></div>
                    <select className="w-full pl-11 pr-10 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none cursor-pointer">
                      <option>Wheat</option>
                      <option>Rice</option>
                      <option>Cotton</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Variety / Hybrid</label>
                  <input type="text" value={formData.variety} onChange={(e) => setFormData({...formData, variety: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Sowing Date <span className="text-danger">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Calendar size={18} /></div>
                    <input type="text" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Area</label>
                  <input type="text" value={formData.area} disabled className="w-full px-4 py-3 bg-secondary/50 border border-border/50 text-text-muted rounded-xl text-sm shadow-sm cursor-not-allowed" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Irrigation Source</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-info"><Droplet size={18} /></div>
                    <select className="w-full pl-11 pr-10 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none cursor-pointer">
                      <option>Tube Well</option>
                      <option>Canal</option>
                      <option>Rainfed</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Soil Type <span className="text-text-muted font-medium text-xs ml-1">(Optional)</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Triangle size={18} /></div>
                    <select className="w-full pl-11 pr-10 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none cursor-pointer">
                      <option>Loamy Soil</option>
                      <option>Clay</option>
                      <option>Sandy</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-bold text-text-main">Description <span className="text-text-muted font-medium text-xs ml-1">(Optional)</span></label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3" 
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-none"
                  ></textarea>
                  <div className="text-right text-xs text-text-muted font-medium mt-1">
                    {formData.description.length}/200
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-info/5 border border-info/20 rounded-xl p-5 flex gap-3 text-info items-start">
                <Info size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-text-main">Why these details matter?</h4>
                  <p className="text-sm text-text-muted mt-0.5">Accurate details help AgriMesh provide precise insights and recommendations for your field.</p>
                </div>
              </div>
            </div>

            {/* Right Column (Summary) */}
            <div className="flex flex-col justify-between h-[800px]">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-text-main text-base mb-4">Field Summary</h3>
                
                <div className="w-full h-40 rounded-xl overflow-hidden relative border border-border mb-6">
                  <img src="https://images.unsplash.com/photo-1595180436402-2ebde09a32c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Satellite" className="absolute inset-0 w-full h-full object-cover" />
                  <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="35,45 55,50 62,75 30,70" fill="rgba(255, 255, 255, 0.1)" stroke="white" strokeWidth="0.5" />
                    <circle cx="35" cy="45" r="1.5" fill="white" />
                    <circle cx="55" cy="50" r="1.5" fill="white" />
                    <circle cx="62" cy="75" r="1.5" fill="white" />
                    <circle cx="30" cy="70" r="1.5" fill="white" />
                  </svg>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><MapPin size={16} className="text-text-muted"/> Location</div><span className="font-bold text-sm">Madhopur, UP, India</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Crosshair size={16} className="text-text-muted"/> Area</div><span className="font-bold text-sm">1.25 ha</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><PenTool size={16} className="text-text-muted"/> Perimeter</div><span className="font-bold text-sm">528 m</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Leaf size={16} className="text-text-muted"/> Crop</div><span className="font-bold text-sm">Wheat</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Sprout size={16} className="text-text-muted"/> Variety</div><span className="font-bold text-sm">Variety X</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Calendar size={16} className="text-text-muted"/> Sowing Date</div><span className="font-bold text-sm">12 Jun 2025</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Droplet size={16} className="text-text-muted"/> Irrigation</div><span className="font-bold text-sm">Tube Well</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Triangle size={16} className="text-text-muted"/> Soil Type</div><span className="font-bold text-sm">Loamy Soil</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setStep(2)} className="px-8 py-3 bg-surface border border-border text-text-main font-bold rounded-lg text-sm hover:bg-secondary transition-colors">Cancel</button>
                <button onClick={() => setStep(4)} className="px-10 py-3 bg-text-main text-surface font-bold rounded-lg text-sm hover:bg-text-main/90 transition-colors shadow-md">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRM */}
        {step === 4 && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column (Success State) */}
            <div className="xl:col-span-2 flex flex-col justify-center">
              <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
                
                {/* Success Header */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center shrink-0">
                    <Check size={40} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-main">Field Created Successfully!</h2>
                    <p className="text-text-muted mt-2 font-medium">Your field has been added to AgriMesh.</p>
                  </div>
                </div>

                <div className="w-full h-px bg-border my-8"></div>

                {/* What's Next */}
                <h3 className="text-lg font-bold text-text-main mb-1">What's Next?</h3>
                <p className="text-sm text-text-muted font-medium mb-6">AgriMesh will now start collecting and analyzing data for your field.</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                    <CloudUpload size={28} className="text-success mb-1" strokeWidth={1.5} />
                    <h4 className="font-bold text-xs text-text-main">Data Collection</h4>
                    <p className="text-[10px] text-text-muted font-medium">We will collect satellite, weather and soil data.</p>
                  </div>
                  <div className="border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                    <BrainCircuit size={28} className="text-success mb-1" strokeWidth={1.5} />
                    <h4 className="font-bold text-xs text-text-main">AI Analysis</h4>
                    <p className="text-[10px] text-text-muted font-medium">Our AI will analyze the data and generate insights.</p>
                  </div>
                  <div className="border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                    <Lightbulb size={28} className="text-success mb-1" strokeWidth={1.5} />
                    <h4 className="font-bold text-xs text-text-main">Smart Insights</h4>
                    <p className="text-[10px] text-text-muted font-medium">You will receive personalized recommendations.</p>
                  </div>
                  <div className="border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                    <Bell size={28} className="text-success mb-1" strokeWidth={1.5} />
                    <h4 className="font-bold text-xs text-text-main">Alerts</h4>
                    <p className="text-[10px] text-text-muted font-medium">We will notify you about important updates.</p>
                  </div>
                </div>

                {/* Tip */}
                <div className="mt-8 bg-info/5 border border-info/20 rounded-xl p-5 flex gap-3 text-info items-start">
                  <Info size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-text-main">Tip</h4>
                    <p className="text-sm text-text-muted mt-0.5 font-medium">You can view and manage this field from My Fields dashboard.</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    onClick={() => { setStep(1); setFormData({...formData, name: ""}) }} 
                    className="px-8 py-3 bg-surface border border-border text-text-main font-bold rounded-lg text-sm hover:bg-secondary transition-colors"
                  >
                    Add Another Field
                  </button>
                  <button 
                    onClick={() => navigate('/fields')} 
                    className="px-10 py-3 bg-text-main text-surface font-bold rounded-lg text-sm hover:bg-text-main/90 transition-colors shadow-md"
                  >
                    Go to My Fields
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (Summary) */}
            <div className="flex flex-col h-[750px]">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm h-full flex flex-col">
                <h3 className="font-bold text-text-main text-base mb-4">Field Summary</h3>
                
                <div className="w-full h-40 rounded-xl overflow-hidden relative border border-border mb-6">
                  <img src="https://images.unsplash.com/photo-1595180436402-2ebde09a32c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Satellite" className="absolute inset-0 w-full h-full object-cover" />
                  <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="35,45 55,50 62,75 30,70" fill="rgba(255, 255, 255, 0.1)" stroke="white" strokeWidth="0.5" />
                    <circle cx="35" cy="45" r="1.5" fill="white" />
                    <circle cx="55" cy="50" r="1.5" fill="white" />
                    <circle cx="62" cy="75" r="1.5" fill="white" />
                    <circle cx="30" cy="70" r="1.5" fill="white" />
                  </svg>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Tag size={16} className="text-text-muted"/> Field Name</div><span className="font-bold text-sm">{formData.name}</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><MapPin size={16} className="text-text-muted"/> Location</div><span className="font-bold text-sm">Madhopur, UP, India</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Crosshair size={16} className="text-text-muted"/> Area</div><span className="font-bold text-sm">{formData.area}</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><PenTool size={16} className="text-text-muted"/> Perimeter</div><span className="font-bold text-sm">528 m</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Leaf size={16} className="text-text-muted"/> Crop</div><span className="font-bold text-sm">{formData.crop}</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Sprout size={16} className="text-text-muted"/> Variety</div><span className="font-bold text-sm">{formData.variety}</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Calendar size={16} className="text-text-muted"/> Sowing Date</div><span className="font-bold text-sm">{formData.date}</span></div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-3"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Droplet size={16} className="text-text-muted"/> Irrigation</div><span className="font-bold text-sm">{formData.irrigation}</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-text-main text-sm font-bold"><Triangle size={16} className="text-text-muted"/> Soil Type</div><span className="font-bold text-sm">{formData.soil}</span></div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

const StepIndicator = ({ active, current, completed, num, label }) => {
  return (
    <div className={`flex items-center gap-3 ${active ? "text-primary" : "text-text-muted"}`}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
        ${current ? "bg-primary border-primary text-surface" : completed ? "bg-primary border-primary text-surface" : "border-border bg-surface text-text-muted"}
      `}>
        {completed ? <Check size={16} strokeWidth={3} /> : num}
      </div>
      <span className={`text-sm ${current ? "font-bold text-text-main" : active ? "font-semibold text-text-main" : "font-medium"}`}>
        {label}
      </span>
    </div>
  );
};

// Mock icon for Sprout since we didn't import it in this file
const Sprout = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 .5-4.9 2z" />
  </svg>
);

const ChevronDown = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
