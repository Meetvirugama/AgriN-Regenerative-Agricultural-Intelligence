import React from 'react';
import { FieldCropState } from '../api/cropApi';
import { TextToSpeechButton } from '../../voice/components/TextToSpeechButton';

interface GrowthStageBannerProps {
  cropState: FieldCropState | null;
  isLoading: boolean;
  onOverrideClick: () => void;
}

export function GrowthStageBanner({ cropState, isLoading, onOverrideClick }: GrowthStageBannerProps) {
  if (isLoading || !cropState) {
    return (
      <div className="bg-surface border border-neutral p-4 rounded-lg shadow-sm animate-pulse flex flex-col gap-2">
        <div className="h-6 bg-neutral/50 rounded w-1/3"></div>
        <div className="h-4 bg-neutral/30 rounded w-2/3"></div>
      </div>
    );
  }

  const { current_stage, stage_conflict, accumulated_gdd, confirmed_crop, stage_description } = cropState;
  
  // Calculate approximate days since sowing based on GDD (15 GDD/day mock logic)
  const approxDays = Math.max(1, Math.floor(accumulated_gdd / 15));

  return (
    <button 
      className="w-full text-left bg-surface border-2 border-primary p-6 rounded-xl shadow-md cursor-pointer transition-colors hover:bg-neutral/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" 
      onClick={onOverrideClick}
      aria-label="Update crop or growth stage"
    >
      {stage_conflict && (
        <div className="mb-3 inline-flex items-center gap-2 bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          <span>We're double-checking your field's stage</span>
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight text-text flex items-center gap-2">
            Day {approxDays} — {current_stage} stage
            <TextToSpeechButton 
              textToRead={`Day ${approxDays}, ${current_stage} stage. ${confirmed_crop}. ${stage_description}`} 
              className="w-8 h-8 p-1" 
            />
          </h2>
          <p className="text-text-muted mt-2 text-sm max-w-xl">
            {confirmed_crop.toUpperCase()} • {stage_description}
          </p>
        </div>
        <div className="text-xs text-text-muted uppercase font-bold tracking-widest underline decoration-dotted underline-offset-4">
          Not right? Fix it
        </div>
      </div>
    </button>
  );
}
