import React, { useState, useRef } from 'react';
import { Camera, ScanSearch, Check, AlertTriangle, PhoneCall, HelpCircle, ImageIcon } from 'lucide-react';
import { diagnosisApi, DiagnosisEvent } from '../api/diagnosisApi';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface DiseaseDiagnosisFlowProps {
  fieldId: string;
  onClose: () => void;
}

export function DiseaseDiagnosisFlow({ fieldId, onClose }: DiseaseDiagnosisFlowProps) {
  const [step, setStep] = useState<'capture' | 'analyzing' | 'result' | 'escalation'>('capture');
  const [result, setResult] = useState<DiagnosisEvent | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Triggered when farmer selects or captures an image. */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    const objectUrl = URL.createObjectURL(file);
    setCapturedImageUrl(objectUrl);
  };

  const handleCapture = async () => {
    if (!capturedBlob) return;
    setStep('analyzing');
    try {
      // Read blob as base64 string
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedBlob);
      });

      // We now pass the real base64 image to our Node.js backend
      const data: any = await diagnosisApi.diagnoseCrop(fieldId, base64String);
      
      // Map the Python AI response to the frontend's DiagnosisEvent
      const mappedResult: DiagnosisEvent = {
        id: `diag-${Date.now()}`,
        field_id: fieldId,
        photo_url: capturedImageUrl || '',
        submitted_at: new Date().toISOString(),
        crop_type: 'Unknown',
        growth_stage: 'Unknown',
        predicted_category: data.severity === 'high' ? 'disease' : 'unknown',
        predicted_label: data.disease_name,
        confidence: data.confidence,
        severity: data.severity as 'low' | 'moderate' | 'high',
        recommended_action_text: data.treatment_recommendation,
        escalation_triggered: data.severity === 'high'
      };
      
      setResult(mappedResult);
      if (mappedResult.escalation_triggered) {
        setStep('escalation');
      } else {
        setStep('result');
      }
    } catch (err) {
      console.error(err);
      setStep('capture');
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
    <Dialog isOpen={true} onClose={onClose} title="Disease Diagnosis" className="max-w-md">
      <div className="flex flex-col min-h-[400px]">
        {step === 'capture' && (
          <div className="flex flex-col items-center justify-center flex-1 py-8">
            {/* Hidden file input — triggered by buttons below */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Image preview area */}
            <div
              className="relative w-48 h-48 border-2 border-dashed border-primary rounded-xl mb-8 flex flex-col items-center justify-center bg-primary/5 overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {capturedImageUrl ? (
                <img
                  src={capturedImageUrl}
                  alt="Captured crop"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary" />
                  <ImageIcon size={32} className="text-primary/40 mb-2" />
                  <p className="text-primary font-bold text-sm text-center px-4">Tap to add photo</p>
                </>
              )}
            </div>

            <h3 className="font-bold text-xl mb-2 text-center">Inspect Crop</h3>
            <p className="text-text-muted text-center text-sm mb-8">
              {capturedImageUrl ? 'Photo selected — ready to analyze.' : 'Take or upload a clear photo of the affected area.'}
            </p>

            <div className="flex flex-col gap-4 w-full">
              {/* Camera capture — opens native camera on mobile */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="w-full"
              >
                <Camera size={20} />
                {capturedImageUrl ? 'Retake Photo' : 'Open Camera / Gallery'}
              </Button>

              {/* Analyze — only enabled after image is selected */}
              <Button
                onClick={handleCapture}
                className="w-full text-lg py-4"
                disabled={!capturedBlob}
              >
                <ScanSearch size={20} />
                Analyze Crop
              </Button>
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
              
              <div className="inline-flex items-center gap-2 mt-2 bg-danger/10 text-danger px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide self-start">
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
            
            <Button 
              onClick={onClose}
              className="w-full text-lg py-4"
            >
              Done
            </Button>
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
                  <div className="p-4 bg-danger/20 rounded-full text-danger">
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
              
              <Button 
                disabled={!consentGiven}
                variant="secondary"
                className="w-full text-lg py-4 border-2 border-secondary text-secondary"
                onClick={async () => {
                  try {
                    const { escalationApi } = await import('../../escalation-dashboard/api/escalationApi');
                    await escalationApi.triggerEscalation(
                      fieldId,
                      result.predicted_category === 'unknown' ? 'low_confidence' : 'high_severity',
                      'Layer07',
                      { issue: result.predicted_label, confidence: result.confidence, consentVerified: true }
                    );
                    console.log('Escalation sent successfully! An expert will reach out soon.');
                    onClose();
                  } catch {
                    console.error('Failed to send escalation.');
                  }
                }}
              >
                <PhoneCall size={20} />
                Connect to Agronomist
              </Button>
            </div>
            
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full text-lg py-4"
            >
              Close for now
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
