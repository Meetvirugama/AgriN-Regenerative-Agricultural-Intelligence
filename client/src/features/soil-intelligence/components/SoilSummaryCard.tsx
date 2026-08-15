import { Leaf, Info, FileText } from 'lucide-react';
import { SoilProfile } from '../api/soilApi';
import { TextToSpeechButton } from '../../voice/components/TextToSpeechButton';

interface SoilSummaryCardProps {
  profile: SoilProfile | null;
  isLoading: boolean;
  onUploadClick: () => void;
}

export function SoilSummaryCard({ profile, isLoading, onUploadClick }: SoilSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-neutral/20 rounded mb-4"></div>
        <div className="h-16 bg-neutral/20 rounded"></div>
      </div>
    );
  }

  if (!profile) {
    // Empty state
    return (
      <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm text-center animate-fade-in">
        <Leaf size={32} className="mx-auto text-text-muted mb-3 opacity-50" />
        <h3 className="font-bold mb-2">No Soil Data</h3>
        <p className="text-sm text-text-muted mb-4">
          Upload a lab report to unlock hyper-local irrigation and nutrient advice.
        </p>
        <button 
          onClick={onUploadClick}
          className="bg-primary text-surface px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Add Lab Report
        </button>
      </div>
    );
  }

  const isLabReport = profile.source === 'lab_report';

  return (
    <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold tracking-wide text-sm text-text-muted uppercase flex items-center gap-2">
          <Leaf size={16} /> Soil Health
        </h3>
        
        {/* Strict Data Provenance Badging (FE Rules) */}
        {isLabReport ? (
          <span className="flex items-center gap-1 bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            <FileText size={12} /> From Lab Report
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-neutral/20 text-text-muted text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            <Info size={12} /> Regional Estimate
          </span>
        )}
      </div>

      <div className="mb-6">
        {profile.summary_text ? (
          <p className="font-medium text-lg leading-snug flex items-start gap-2">
            {profile.summary_text}
            <TextToSpeechButton 
              textToRead={`Soil Profile: ${profile.summary_text}`} 
              className="w-8 h-8 p-1 shrink-0" 
            />
          </p>
        ) : (
          <p className="font-medium text-lg leading-snug text-text-muted italic">
            Summary generation pending Layer 09 integration.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-background rounded-lg border border-neutral">
          <span className="text-text-muted text-xs block mb-1">Texture</span>
          <span className="font-bold capitalize">{profile.texture.replace('_', ' ')}</span>
        </div>
        <div className="p-3 bg-background rounded-lg border border-neutral">
          <span className="text-text-muted text-xs block mb-1">Organic Matter</span>
          <span className="font-bold">{profile.organic_matter_pct}%</span>
        </div>
        <div className="p-3 bg-background rounded-lg border border-neutral">
          <span className="text-text-muted text-xs block mb-1">Water Holding</span>
          <span className="font-bold capitalize">{profile.water_holding_capacity}</span>
        </div>
        <div className="p-3 bg-background rounded-lg border border-neutral">
          <span className="text-text-muted text-xs block mb-1">pH Level</span>
          <span className="font-bold">{profile.ph}</span>
        </div>
      </div>

      {!isLabReport && (
        <button 
          onClick={onUploadClick}
          className="w-full mt-4 border-2 border-primary text-primary px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Replace with Lab Report
        </button>
      )}
    </div>
  );
}
