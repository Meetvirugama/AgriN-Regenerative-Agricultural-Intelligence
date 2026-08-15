import React from 'react';
import { StageEnum } from '../api/cropApi';

interface StageProgressIndicatorProps {
  currentStage?: StageEnum;
}

const STAGES: StageEnum[] = ['germination', 'vegetative', 'flowering', 'maturity'];

export function StageProgressIndicator({ currentStage }: StageProgressIndicatorProps) {
  if (!currentStage) return null;

  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral rounded-full z-0"></div>
        
        {/* Active track line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-success rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          let dotClass = "w-4 h-4 rounded-full border-2 z-10 transition-colors bg-surface ";
          let labelClass = "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider transition-colors ";

          if (isCompleted) {
            dotClass += "border-success bg-success";
            labelClass += "text-success";
          } else if (isActive) {
            dotClass += "border-primary ring-4 ring-primary/20 scale-125 bg-primary";
            labelClass += "text-primary font-black";
          } else if (isPending) {
            dotClass += "border-neutral";
            labelClass += "text-text-muted";
          }

          return (
            <div key={stage} className="relative flex flex-col items-center justify-center">
              <div className={dotClass} />
              <span className={labelClass}>{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
