import React, { useEffect, useState } from 'react';
import { Advisory } from '../types';
import { advisoryApi } from '../api/advisoryApi';
import { TextToSpeechButton } from '../../voice/components/TextToSpeechButton';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { mapSeverityToStatus } from '../../../types/status';

interface AdvisoryCardProps {
  fieldId: string;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({ fieldId }) => {
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [escalationSent, setEscalationSent] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAdvisory = async () => {
      try {
        setLoading(true);
        const data = await advisoryApi.getAdvisory(fieldId);
        setAdvisory(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisory();
  }, [fieldId]);

  if (error) {
    return (
      <Card className="bg-danger/10 border-danger/30 p-6 text-center">
        <p className="text-danger font-bold">Failed to load AI advisory.</p>
      </Card>
    );
  }

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
      <Card className="animate-pulse">
        <div className="h-6 bg-neutral/20 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-neutral/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-neutral/20 rounded w-5/6 mb-6"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-neutral/20 rounded w-1/3"></div>
          <div className="h-10 bg-neutral/20 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (!advisory) {
    return null;
  }

  // Handle the "No action needed" state
  if (advisory.action_text.toLowerCase().includes('no action needed') || advisory.severity === 'Low') {
    return (
      <Card className="bg-success/10 border-success/30">
        <h3 className="font-bold text-success mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Conditions are good
        </h3>
        <p className="text-sm text-text-muted">Nothing to do today. We'll keep monitoring your field.</p>
      </Card>
    );
  }

  const status = mapSeverityToStatus(advisory.severity);
  const statusColors = {
    healthy: 'bg-success border-success',
    neutral: 'bg-neutral border-neutral',
    info: 'bg-info border-info',
    attention: 'bg-warning border-warning',
    urgent: 'bg-danger border-danger',
  };

  return (
    <Card className="relative overflow-hidden pt-6">
      <div className={`absolute top-0 left-0 w-1 h-full ${statusColors[status].split(' ')[0]}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-black text-xl tracking-tight text-text flex items-center gap-2">
          AgriMesh Advisory
          <TextToSpeechButton 
            textToRead={`AgriMesh Advisory: ${advisory.severity} Priority. ${advisory.action_text} ${advisory.action_deadline}. ${advisory.what_text} ${advisory.why_text}. What to monitor: ${advisory.monitor_text}`} 
            className="w-8 h-8 p-1"
          />
        </h3>
        <StatusBadge status={status}>{advisory.severity} Priority</StatusBadge>
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-lg font-bold leading-tight">
          {advisory.action_text} <span className="text-primary">{advisory.action_deadline}</span>.
        </p>
        
        <p className="text-text-muted leading-relaxed">
          {advisory.what_text} {advisory.why_text}
        </p>

        {advisory.historical_parallel_callout && (
          <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-text">
              {advisory.historical_parallel_callout}
            </p>
          </div>
        )}

        <p className="text-sm font-semibold text-text/80 bg-neutral/10 p-3 rounded-lg border border-neutral/20">
          <span className="uppercase tracking-widest text-xs text-text-muted block mb-1">What to monitor</span>
          {advisory.monitor_text}
        </p>
      </div>

      {!feedbackGiven ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest font-bold text-text-muted">Farmer Response</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleFeedback('followed')}>
              I'll do this
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleFeedback('ignored')}>
              Already did
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleFeedback('overridden')}>
              Doesn't seem right
            </Button>
          </div>
          
          {showOverrideInput && (
            <div className="mt-4 flex gap-2 animate-fade-in">
              <input 
                type="text" 
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why not? (e.g. Too wet to spray)" 
                className="flex-1 px-4 py-2 bg-background border border-neutral rounded-none outline-none focus:border-text-main"
                autoFocus
              />
              <Button size="sm" variant="secondary" onClick={() => handleFeedback('overridden')} disabled={!overrideReason.trim()}>
                Submit
              </Button>
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

      {status === 'urgent' && !escalationSent && (
        <div className="mt-6 p-4 bg-danger/5 border border-danger/20 rounded-xl">
          <h4 className="font-bold text-danger text-sm mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            High Severity Risk Detected
          </h4>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            This issue could significantly impact your yield. We recommend escalating this data to an extension officer for review.
          </p>

          <div className="flex items-start gap-2 text-left mb-4">
            <input 
              type="checkbox" 
              id="advisory-consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 text-danger rounded focus:ring-danger accent-danger flex-shrink-0"
            />
            <label htmlFor="advisory-consent" className="text-[11px] text-text-muted font-medium cursor-pointer leading-tight">
              I consent to share this advisory, my field history, and satellite context with my local extension network.
            </label>
          </div>

          <Button 
            disabled={!consentGiven}
            variant="destructive"
            className="w-full"
            onClick={async () => {
              try {
                const { escalationApi } = await import('../../escalation-dashboard/api/escalationApi');
                await escalationApi.triggerEscalation(
                  fieldId,
                  'high_severity',
                  'Layer09',
                  { issue: advisory.what_text, action: advisory.action_text, consentVerified: true }
                );
                setEscalationSent(true);
              } catch (e) {
                console.error('Failed to escalate', e);
              }
            }}
          >
            Escalate to Agronomist
          </Button>
        </div>
      )}

      {escalationSent && (
        <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-xl text-center">
          <p className="text-sm font-bold text-success flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Escalation Sent
          </p>
          <p className="text-xs text-text-muted mt-1">An expert will review your field data.</p>
        </div>
      )}
    </Card>
  );
};
