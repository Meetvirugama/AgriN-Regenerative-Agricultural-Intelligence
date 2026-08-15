import React from 'react';
import { X, TrendingUp, AlertTriangle } from 'lucide-react';
import { CropRanking } from '../api/regenApi';

interface CropPlanningModalProps {
  options: CropRanking[];
  onClose: () => void;
}

export function CropPlanningModal({ options, onClose }: CropPlanningModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col p-4 animate-fade-in">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-end pb-8">
        <div className="bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col relative max-h-[80vh]">
          
          <button 
            aria-label="Close" 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 bg-background/50 hover:bg-neutral/50 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X size={24} />
          </button>

          <div className="p-6 border-b border-neutral">
            <h2 className="text-2xl font-black">Next Season Options</h2>
            <p className="text-text-muted text-sm mt-1">AI-ranked crops for your field based on soil health and climate outlook.</p>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            {options.map((crop, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl border-2 ${
                  crop.suitability_score >= 80 ? 'border-primary bg-primary/5' : 
                  crop.suitability_score >= 60 ? 'border-secondary bg-secondary/5' : 
                  'border-error/30 bg-error/5'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{crop.crop_type}</h3>
                    {crop.variety && <p className="text-text-muted text-sm uppercase tracking-wider font-bold">{crop.variety}</p>}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    crop.suitability_score >= 80 ? 'bg-primary text-primary-content' : 
                    crop.suitability_score >= 60 ? 'bg-secondary text-secondary-content' : 
                    'bg-error text-error-content'
                  }`}>
                    {crop.suitability_score}/100 Match
                  </div>
                </div>

                <div className="mt-4 flex gap-2 items-start text-sm text-text">
                  <TrendingUp size={16} className="text-primary shrink-0 mt-0.5" />
                  <p>{crop.reasoning}</p>
                </div>

                {crop.risk_factors.length > 0 && (
                  <div className="mt-4 p-3 bg-background rounded-lg border border-neutral">
                    <h4 className="text-xs font-bold uppercase text-text-muted flex items-center gap-1 mb-2">
                      <AlertTriangle size={14} className="text-warning" /> Risks to Consider
                    </h4>
                    <ul className="list-disc pl-4 text-sm text-text-muted">
                      {crop.risk_factors.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
