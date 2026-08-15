import React, { useEffect, useState } from 'react';
import { Advisory } from '../types';
import { advisoryApi } from '../api/advisoryApi';

interface AdvisoryCardProps {
  fieldId: string;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({ fieldId }) => {
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  useEffect(() => {
    const fetchAdvisory = async () => {
      setLoading(true);
      const data = await advisoryApi.getAdvisory(fieldId);
      setAdvisory(data);
      setLoading(false);
    };
    fetchAdvisory();
  }, [fieldId]);

  const handleFeedback = async (action: 'followed' | 'ignored' | 'overridden') => {
    if (action === 'overridden' && !showOverrideInput) {
      setShowOverrideInput(true);
      return;
    }
    
    if (advisory) {
      await advisoryApi.submitFeedback(fieldId, advisory.id, { 
        action, 
        reason: action === 'overridden' ? overrideReason : undefined 
      });
      setFeedbackGiven(true);
      setShowOverrideInput(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm animate-pulse">
        <div className="h-6 bg-neutral/20 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-neutral/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-neutral/20 rounded w-5/6 mb-6"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-neutral/20 rounded w-1/3"></div>
          <div className="h-10 bg-neutral/20 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!advisory) {
    return null;
  }

  // Handle the "No action needed" state
  if (advisory.action_text.toLowerCase().includes('no action needed') || advisory.severity === 'Low') {
    return (
      <div className="bg-success/10 border border-success/30 p-6 rounded-xl shadow-sm">
        <h3 className="font-bold text-success mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Conditions are good
        </h3>
        <p className="text-sm text-text-muted">Nothing to do today. We'll keep monitoring your field.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-error border-error bg-error/10';
      case 'High': return 'text-warning border-warning bg-warning/10';
      case 'Medium': return 'text-primary border-primary bg-primary/10';
      default: return 'text-success border-success bg-success/10';
    }
  };

  const severityColor = getSeverityColor(advisory.severity);

  return (
    <div className={`border-2 p-6 rounded-xl shadow-md ${severityColor.replace('text-', 'border-').split(' ')[1]} bg-surface relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${severityColor.split(' ')[0].replace('text-', 'bg-')}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-black text-xl tracking-tight text-text">AgriMesh Advisory</h3>
        <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${severityColor}`}>
          {advisory.severity} Priority
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-lg font-bold leading-tight">
          {advisory.action_text} <span className="text-primary">{advisory.action_deadline}</span>.
        </p>
        
        <p className="text-text-muted leading-relaxed">
          {advisory.what_text} {advisory.why_text}
        </p>

        <p className="text-sm font-semibold text-text/80 bg-neutral/10 p-3 rounded-lg border border-neutral/20">
          <span className="uppercase tracking-widest text-xs text-text-muted block mb-1">What to monitor</span>
          {advisory.monitor_text}
        </p>
      </div>

      {!feedbackGiven ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest font-bold text-text-muted">Farmer Response</p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleFeedback('followed')}
              className="btn btn-primary text-sm py-2 px-4"
            >
              I'll do this
            </button>
            <button 
              onClick={() => handleFeedback('ignored')}
              className="btn bg-neutral/20 text-text hover:bg-neutral/30 text-sm py-2 px-4"
            >
              Already did
            </button>
            <button 
              onClick={() => handleFeedback('overridden')}
              className="btn bg-neutral/20 text-text hover:bg-neutral/30 text-sm py-2 px-4"
            >
              Doesn't seem right
            </button>
          </div>
          
          {showOverrideInput && (
            <div className="mt-4 flex gap-2 animate-fade-in">
              <input 
                type="text" 
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why not? (e.g. Too wet to spray)" 
                className="input flex-1"
                autoFocus
              />
              <button 
                onClick={() => handleFeedback('overridden')}
                className="btn btn-secondary whitespace-nowrap"
                disabled={!overrideReason.trim()}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 text-sm font-bold text-success flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Response recorded.
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-neutral/20 text-[10px] uppercase tracking-widest text-text-muted/60">
        Sources: {advisory.source_layers.join(' • ')}
      </div>
    </div>
  );
};
