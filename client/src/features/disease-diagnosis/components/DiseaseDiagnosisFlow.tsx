import React, { useState } from 'react';
import { Camera, X, ScanSearch, Check, AlertTriangle, PhoneCall, HelpCircle } from 'lucide-react';
import { diagnosisApi, DiagnosisEvent } from '../api/diagnosisApi';

interface DiseaseDiagnosisFlowProps {
  fieldId: string;
  onClose: () => void;
}

export function DiseaseDiagnosisFlow({ fieldId, onClose }: DiseaseDiagnosisFlowProps) {
  const [step, setStep] = useState<'capture' | 'analyzing' | 'result' | 'escalation'>('capture');
  const [result, setResult] = useState<DiagnosisEvent | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const simulateCapture = async (isBlurry: boolean = false) => {
    setStep('analyzing');
    try {
      // 999 bytes forces "unknown" in our backend mock
      const blobSize = isBlurry ? 999 : 2048; 
      const data = await diagnosisApi.diagnoseCrop(fieldId, blobSize);
      setResult(data);
      if (data.escalation_triggered) {
        setStep('escalation');
      } else {
        setStep('result');
      }
    } catch (err) {
      console.error(err);
      setStep('capture'); // reset on error
    }
  };

  const renderConfidenceDots = (confidence: number) => {
    // fairly sure (> 0.8), somewhat sure (0.5 - 0.8), not sure (< 0.5)
    const tier = confidence > 0.8 ? 3 : confidence >= 0.5 ? 2 : 1;
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          <div className={`w-3 h-3 rounded-full ${tier >= 1 ? 'bg-primary' : 'border-2 border-primary'}`}></div>
          <div className={`w-3 h-3 rounded-full ${tier >= 2 ? 'bg-primary' : 'border-2 border-primary'}`}></div>
          <div className={`w-3 h-3 rounded-full ${tier >= 3 ? 'bg-primary' : 'border-2 border-primary'}`}></div>
        </div>
        <span className="text-xs font-bold text-primary ml-1 uppercase tracking-wider">
          {tier === 3 ? 'Fairly Sure' : tier === 2 ? 'Somewhat Sure' : 'Not Sure'}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col p-4 animate-fade-in">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-end pb-8">
        <div className="bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col relative">
          
          <button 
            aria-label="Close" 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 bg-background/50 hover:bg-neutral/50 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X size={24} />
          </button>

          <div className="p-6 flex-1 flex flex-col min-h-[400px]">
            {step === 'capture' && (
              <div className="flex flex-col items-center justify-center flex-1 py-8">
                <div className="relative w-48 h-48 border-2 border-dashed border-primary rounded-xl mb-8 flex flex-col items-center justify-center bg-primary/5">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                  <p className="text-primary font-bold text-sm text-center px-4">Center the affected leaf/area</p>
                </div>
                
                <h3 className="font-bold text-xl mb-2 text-center">Inspect Crop</h3>
                <p className="text-text-muted text-center text-sm mb-8">Take a clear photo of the symptoms.</p>
                
                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={() => simulateCapture(false)}
                    className="w-full py-4 bg-primary text-primary-content font-bold rounded-xl text-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <Camera size={24} />
                    Take Photo
                  </button>
                  
                  <button 
                    onClick={() => simulateCapture(true)}
                    className="w-full py-3 border-2 border-neutral text-text-muted font-bold rounded-xl text-sm hover:bg-neutral/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    Test "Unknown/Blurry" Flow
                  </button>
                </div>
              </div>
            )}

            {step === 'analyzing' && (
              <div className="flex flex-col items-center justify-center flex-1 py-12">
                <ScanSearch size={64} className="text-primary animate-bounce mb-6" />
                <h3 className="font-bold text-xl animate-pulse">Looking closely at your photo...</h3>
                <p className="text-text-muted mt-2 text-sm text-center">Checking field history and recent weather context.</p>
              </div>
            )}

            {step === 'result' && result && (
              <div className="flex flex-col flex-1">
                <div className="mb-6 flex flex-col gap-2">
                  <h4 className="uppercase tracking-widest text-text-muted text-xs font-bold">Diagnosis</h4>
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-text leading-tight">{result.predicted_label}</h2>
                    {renderConfidenceDots(result.confidence)}
                  </div>
                  
                  <div className="inline-flex items-center gap-2 mt-2 bg-error/10 text-error px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide self-start">
                    <span>Severity: {result.severity}</span>
                  </div>
                </div>

                <div className="bg-primary/10 border-2 border-primary rounded-xl p-5 mb-8 flex-1">
                  <h3 className="font-bold text-primary uppercase tracking-widest text-sm mb-3 flex items-center gap-2">
                    <Check size={18} /> What you should do
                  </h3>
                  <p className="text-lg font-medium text-text leading-relaxed">
                    {result.recommended_action_text}
                  </p>
                </div>
                
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-primary text-primary-content font-bold rounded-xl text-lg hover:brightness-110 active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  Done
                </button>
              </div>
            )}

            {step === 'escalation' && result && (
              <div className="flex flex-col flex-1">
                <div className="mb-6">
                  {result.predicted_category === 'unknown' ? (
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-warning/20 rounded-full text-warning">
                        <HelpCircle size={48} />
                      </div>
                      <h2 className="text-2xl font-black text-text">We're not totally sure.</h2>
                      <p className="text-text-muted">The photo might be unclear, or this could be a rare issue. We shouldn't guess when it comes to your crop.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-error/20 rounded-full text-error">
                        <AlertTriangle size={48} />
                      </div>
                      <h2 className="text-2xl font-black text-text">High Severity Risk</h2>
                      <p className="text-text-muted">This looks like {result.predicted_label}. Because this can spread quickly, we need to escalate this immediately.</p>
                    </div>
                  )}
                </div>

                <div className="bg-surface border-2 border-neutral rounded-xl p-6 mb-8 mt-4 text-center">
                  <h3 className="font-bold text-lg mb-2">Let's get a human to look.</h3>
                  <p className="text-sm text-text-muted mb-4">We'll send your photo and field history directly to your local extension officer.</p>
                  
                  <div className="flex items-start gap-3 text-left bg-neutral/10 p-3 rounded-lg mb-6 border border-neutral">
                    <input 
                      type="checkbox" 
                      id="escalation-consent"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary accent-primary"
                    />
                    <label htmlFor="escalation-consent" className="text-xs text-text-muted font-medium cursor-pointer leading-tight">
                      By checking this box, I explicitly consent to sharing this field's diagnosis history and recent satellite metrics with my local extension network.
                    </label>
                  </div>
                  
                  <button 
                    disabled={!consentGiven}
                    onClick={async () => {
                      try {
                        const { escalationApi } = await import('../../escalation-dashboard/api/escalationApi');
                        await escalationApi.triggerEscalation(
                          fieldId,
                          result.predicted_category === 'unknown' ? 'low_confidence' : 'high_severity',
                          'Layer07',
                          { issue: result.predicted_label, confidence: result.confidence, consentVerified: true }
                        );
                        alert('Escalation sent successfully! An expert will reach out soon.');
                        onClose();
                      } catch {
                        alert('Failed to send escalation.');
                      }
                    }}
                    className="w-full py-4 bg-secondary text-secondary-content font-bold rounded-xl text-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <PhoneCall size={20} />
                    Connect to Agronomist
                  </button>
                </div>
                
                <button 
                  onClick={onClose}
                  className="w-full py-4 border-2 border-neutral font-bold rounded-xl text-lg hover:bg-neutral/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral focus-visible:outline-offset-2"
                >
                  Close for now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
