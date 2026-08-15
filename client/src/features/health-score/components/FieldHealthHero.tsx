import React from 'react';
import { FieldHealthScore } from '../types/health-score.types';
import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface FieldHealthHeroProps {
  score: FieldHealthScore | null;
  loading: boolean;
}

export const FieldHealthHero: React.FC<FieldHealthHeroProps> = ({ score, loading }) => {
  if (loading) {
    return (
      <div className="bg-surface p-6 border-b border-border animate-pulse">
        <div className="h-4 w-32 bg-background mb-4"></div>
        <div className="h-8 w-3/4 bg-background"></div>
      </div>
    );
  }

  if (!score) return null;

  // Synthesis text will come from Layer 09 later, for now we fall back to a basic aggregation
  let synthesisText = score.synthesis_text;
  
  if (!synthesisText) {
     if (score.crop_health.severity === 'red') {
         synthesisText = "Action required: Field is showing signs of critical stress.";
     } else if (score.crop_health.severity === 'amber') {
         synthesisText = "Monitor closely: Several risk factors require your attention.";
     } else {
         synthesisText = "Your field is in good shape overall. Conditions are stable.";
     }
  }

  // Determine overall hero color based on the crop_health dimension
  let bgColorClass = 'bg-success/10';
  let borderColorClass = 'border-success/30';
  let textColorClass = 'text-success';
  let Icon = CheckCircle;

  if (score.crop_health.severity === 'red') {
    bgColorClass = 'bg-danger/10';
    borderColorClass = 'border-danger/30';
    textColorClass = 'text-danger';
    Icon = AlertCircle;
  } else if (score.crop_health.severity === 'amber') {
    bgColorClass = 'bg-warning/10';
    borderColorClass = 'border-warning/30';
    textColorClass = 'text-warning';
    Icon = AlertTriangle;
  }

  return (
    <div className={`p-6 border-b border-l-4 ${bgColorClass} ${borderColorClass} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2 text-text-muted">
        <Info size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">Field Synthesis</span>
      </div>
      
      <div className="flex items-start gap-4">
         <Icon className={`${textColorClass} mt-1 flex-shrink-0`} size={32} />
         <h2 className="text-2xl font-bold leading-tight">
           {synthesisText}
         </h2>
      </div>
    </div>
  );
};
