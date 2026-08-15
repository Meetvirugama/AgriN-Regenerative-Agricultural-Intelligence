import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { CropRanking } from '../api/regenApi';
import { Dialog } from '../../../components/ui/Dialog';

interface CropPlanningModalProps {
  options: CropRanking[];
  onClose: () => void;
}

export function CropPlanningModal({ options, onClose }: CropPlanningModalProps) {
  return (
    <Dialog isOpen={true} onClose={onClose} title="Next Season Options" className="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-text-muted text-sm -mt-2 mb-2">AI-ranked crops for your field based on soil health and climate outlook.</p>
        
        <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-4 pr-1">
          {options.map((crop, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl border-2 ${
                crop.suitability_score >= 80 ? 'border-primary bg-primary/5' : 
                crop.suitability_score >= 60 ? 'border-secondary bg-secondary/5' : 
                'border-danger/30 bg-danger/5'
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
                  'bg-danger text-background'
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
    </Dialog>
  );
}
