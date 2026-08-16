import React, { useState } from "react";
import { ArrowLeft, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AddFieldWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Location, 2: Boundary, 3: Details, 4: Confirm

  return (
    <div className="animate-fade-in-up flex flex-col h-[calc(100vh-8rem)]">
      
      {/* HEADER & STEPPER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-text-main ml-4 border-l border-border pl-4">Add New Field</h1>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center gap-4 text-sm font-medium">
          <StepIndicator active={step >= 1} current={step === 1} num={1} label="Location" />
          <div className="w-8 h-px bg-border"></div>
          <StepIndicator active={step >= 2} current={step === 2} num={2} label="Boundary" />
          <div className="w-8 h-px bg-border"></div>
          <StepIndicator active={step >= 3} current={step === 3} num={3} label="Details" />
          <div className="w-8 h-px bg-border"></div>
          <StepIndicator active={step >= 4} current={step === 4} num={4} label="Confirm" />
        </div>
      </div>

      {/* STEP CONTENT */}
      <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
        
        {/* Step 1: Location Content */}
        {step === 1 && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text-main mb-4">Search or select your field location</h2>
              <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search location..." 
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>
            {/* Map Placeholder */}
            <div className="flex-1 bg-[#e5e5e5] relative flex items-center justify-center">
               <div className="w-12 h-12 bg-primary rounded-full text-surface flex items-center justify-center shadow-lg border-2 border-surface shadow-primary/30">
                 <MapPin size={24} />
               </div>
               {/* Map overlay UI */}
               <div className="absolute bottom-6 right-6">
                 <button 
                   onClick={() => setStep(2)}
                   className="px-8 py-2.5 bg-text-main text-surface font-semibold rounded-lg text-sm hover:bg-text-main/90 transition-colors shadow-lg"
                 >
                   Next
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Step 2: Boundary Content */}
        {step === 2 && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text-main">Draw your field boundary on the map</h2>
            </div>
            {/* Map Placeholder */}
            <div className="flex-1 bg-[#4a554a] relative flex items-center justify-center overflow-hidden">
               {/* Faux Satellite Imagery Map Background */}
               <img 
                 src="https://images.unsplash.com/photo-1595180436402-2ebde09a32c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                 className="absolute inset-0 w-full h-full object-cover opacity-80"
                 alt="Satellite"
               />
               
               {/* Faux Polygon */}
               <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <polygon 
                   points="30,20 70,30 80,70 20,80" 
                   fill="rgba(255,255,255,0.2)" 
                   stroke="white" 
                   strokeWidth="0.5"
                 />
                 <circle cx="30" cy="20" r="1" fill="white" />
                 <circle cx="70" cy="30" r="1" fill="white" />
                 <circle cx="80" cy="70" r="1" fill="white" />
                 <circle cx="20" cy="80" r="1" fill="white" />
               </svg>

               {/* Zoom controls */}
               <div className="absolute bottom-6 right-6 flex flex-col bg-surface rounded-lg shadow-lg border border-border overflow-hidden z-20">
                 <button className="w-10 h-10 flex items-center justify-center border-b border-border hover:bg-secondary font-bold">+</button>
                 <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary font-bold">-</button>
               </div>

               {/* Map overlay UI */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                 <button 
                   onClick={() => setStep(1)}
                   className="px-6 py-2.5 bg-surface text-text-main font-semibold rounded-lg text-sm hover:bg-secondary border border-border transition-colors shadow-lg"
                 >
                   Clear
                 </button>
                 <button 
                   onClick={() => navigate('/fields')}
                   className="px-8 py-2.5 bg-text-main text-surface font-semibold rounded-lg text-sm hover:bg-text-main/90 transition-colors shadow-lg"
                 >
                   Next
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const StepIndicator = ({ active, current, num, label }) => {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-text-main" : "text-text-muted"}`}>
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
        ${current ? "bg-primary text-surface" : active ? "bg-primary/20 text-primary" : "bg-secondary text-text-muted"}
      `}>
        {num}
      </div>
      <span className={current ? "font-bold text-primary" : ""}>{label}</span>
    </div>
  );
};
