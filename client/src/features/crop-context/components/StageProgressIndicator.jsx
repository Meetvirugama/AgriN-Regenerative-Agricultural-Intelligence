import React from "react";
import { Check, Leaf, Sprout, Flower2, Wheat } from "lucide-react";
import { Card } from "../../../components/ui/Card";

const STAGES = [
  { id: "germination", label: "Germination", icon: Sprout },
  { id: "vegetative", label: "Vegetative", icon: Leaf },
  { id: "flowering", label: "Flowering", icon: Flower2 },
  { id: "maturity", label: "Maturity", icon: Wheat }
];

export function StageProgressIndicator({ currentStage }) {
  if (!currentStage) return null;

  const normalizedStage = currentStage.toLowerCase();
  const currentIndex = STAGES.findIndex(s => s.id === normalizedStage);

  if (currentIndex === -1) return null;

  return (
    <Card className="w-full p-8 overflow-hidden bg-surface rounded-[2rem] shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-sm font-black text-text-muted uppercase tracking-[0.2em]">Season Progress</h3>
        <div className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {(currentIndex / (STAGES.length - 1) * 100).toFixed(0)}% Complete
        </div>
      </div>
      
      <div className="relative px-4 sm:px-8">
        {/* Background track */}
        <div className="absolute top-1/2 left-4 right-4 h-2 -translate-y-1/2 bg-neutral/30 rounded-full sm:left-8 sm:right-8"></div>
        
        {/* Active track with gradient */}
        <div
          className="absolute top-1/2 left-4 h-2 -translate-y-1/2 bg-gradient-to-r from-success via-success to-primary rounded-full transition-all duration-1000 ease-out sm:left-8"
          style={{ width: `calc(${(currentIndex / (STAGES.length - 1)) * 100}% - ${currentIndex === 0 ? '0px' : '2rem'})` }}
        ></div>

        {/* Nodes */}
        <div className="relative flex justify-between items-center z-10">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isPending = idx > currentIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center group relative">
                {/* Connecting Pulse Effect for Active Stage */}
                {isActive && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary/20 rounded-full animate-ping pointer-events-none" />
                )}

                <div 
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10
                    ${isCompleted ? "bg-success text-surface shadow-md shadow-success/20 -translate-y-1" : ""}
                    ${isActive ? "bg-surface border-4 border-primary text-primary scale-110 shadow-xl shadow-primary/20 -translate-y-2" : ""}
                    ${isPending ? "bg-surface border-2 border-neutral/50 text-neutral/50" : ""}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  ) : (
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                  )}
                </div>
                
                <div 
                  className={`
                    absolute top-16 sm:top-20 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-500 w-32 text-center
                    ${isCompleted ? "text-success opacity-80" : ""}
                    ${isActive ? "text-primary scale-105" : ""}
                    ${isPending ? "text-text-muted/40" : ""}
                  `}
                >
                  {stage.label}
                  {isActive && (
                    <span className="block text-[10px] sm:text-xs font-bold text-primary/70 mt-1 uppercase tracking-widest">
                      Current
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Spacer for absolute positioned labels */}
      <div className="mt-16 sm:mt-20"></div> 
    </Card>
  );
}
