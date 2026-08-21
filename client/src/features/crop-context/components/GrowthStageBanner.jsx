import React from "react";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";
import { PenLine } from "lucide-react";

export function GrowthStageBanner({ cropState, isLoading, onOverrideClick }) {
  if (isLoading || !cropState) {
    return (
      <div className="bg-surface border border-neutral p-6 rounded-2xl shadow-sm animate-pulse flex flex-col gap-3">
        <div className="h-8 bg-neutral/50 rounded w-1/3"></div>
        <div className="h-4 bg-neutral/30 rounded w-2/3"></div>
      </div>
    );
  }

  const {
    current_stage,
    stage_conflict,
    accumulated_gdd,
    confirmed_crop,
    stage_description,
  } = cropState;

  const approxDays = Math.max(1, Math.floor(accumulated_gdd / 15));

  return (
    <div className="relative overflow-hidden w-full bg-gradient-to-br from-success/5 to-success/15 border border-success/30 p-6 sm:p-8 rounded-[2rem] shadow-sm group transition-all duration-300 hover:shadow-md hover:border-success/50">
      
      {/* Background decoration */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-success/10 rounded-full blur-3xl group-hover:bg-success/20 transition-all duration-700 ease-in-out"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700 ease-in-out"></div>

      {stage_conflict && (
        <div className="mb-5 inline-flex items-center gap-2.5 bg-warning/20 text-warning-strong px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning"></span>
          </span>
          System is verifying this stage
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 relative z-10">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-text">
              Day {approxDays} — {current_stage}
            </h2>
            <TextToSpeechButton
              textToRead={`Day ${approxDays}, ${current_stage || "unknown"} stage. ${confirmed_crop || "unknown crop"}. ${stage_description || ""}`}
              className="w-10 h-10 p-2.5 bg-surface/80 hover:bg-success text-success hover:text-surface rounded-full shadow-sm border border-success/20 transition-all duration-300 backdrop-blur-sm"
            />
          </div>
          <p className="text-text-muted text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
            <span className="font-extrabold text-text uppercase tracking-widest mr-2">{confirmed_crop || "Unknown"}</span> 
            <span className="opacity-80">{stage_description}</span>
          </p>
        </div>

        <button
          onClick={onOverrideClick}
          className="shrink-0 flex items-center gap-2.5 px-5 py-3 bg-surface/90 backdrop-blur-md text-text font-bold text-sm uppercase tracking-widest rounded-2xl border border-border shadow-sm hover:border-success hover:text-success transition-all duration-300 active:scale-95 group/btn"
          aria-label="Update crop or growth stage"
        >
          <PenLine className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
          Fix Stage
        </button>
      </div>
    </div>
  );
}
