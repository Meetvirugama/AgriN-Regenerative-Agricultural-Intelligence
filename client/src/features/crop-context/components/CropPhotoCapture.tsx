import React, { useState } from 'react';
import { Camera, X, Check, Search, AlertCircle } from 'lucide-react';

interface CropPhotoCaptureProps {
  onClose: () => void;
  onIdentify: (mockFile: Blob) => Promise<any>;
  onOverrideConfirm: (cropType: string, stage?: string) => Promise<void>;
}

export function CropPhotoCapture({ onClose, onIdentify, onOverrideConfirm }: CropPhotoCaptureProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result' | 'manual'>('upload');
  const [result, setResult] = useState<any>(null);
  
  const [manualCrop, setManualCrop] = useState('wheat');
  const [manualStage, setManualStage] = useState('vegetative');

  const handleSimulateCapture = async () => {
    setStep('analyzing');
    try {
      // Simulate fake blob
      const blob = new Blob(["mock"], { type: "image/jpeg" });
      const analysis = await onIdentify(blob);
      setResult(analysis);
      setStep('result');
    } catch {
      setStep('manual'); // fallback
    }
  };

  const handleConfirmResult = async () => {
    // Only update the crop type, leave stage as undefined to let backend preserve/recompute
    await onOverrideConfirm(result.crop);
    onClose();
  };

  const handleManualSubmit = async () => {
    await onOverrideConfirm(manualCrop, manualStage);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral flex justify-between items-center bg-surface">
          <h3 className="font-bold text-lg">Update Crop Information</h3>
          <button aria-label="Close" onClick={onClose} className="p-1 hover:bg-neutral rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <button 
                onClick={handleSimulateCapture}
                className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                <Camera size={40} />
              </button>
              <div className="text-center">
                <p className="font-bold text-lg">Take a photo of your crop</p>
                <p className="text-sm text-text-muted">Our AI will identify the crop and growth stage</p>
              </div>
              <button onClick={() => setStep('manual')} className="text-sm text-primary font-bold underline mt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                Enter manually instead
              </button>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Search size={48} className="text-primary animate-pulse" />
              <p className="font-bold text-lg animate-pulse">Analyzing image...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="flex flex-col gap-6">
              <div className="bg-success/10 border border-success p-4 rounded-xl flex items-start gap-4">
                <Check size={28} className="text-success shrink-0" />
                <div>
                  <h4 className="font-bold text-success text-lg uppercase tracking-wide">
                    {result.crop} • {result.variety}
                  </h4>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex gap-0.5">
                      <div className={`w-3 h-3 rounded-full ${result.confidence === 'high' || result.confidence === 'moderate' || result.confidence === 'low' ? 'bg-success' : 'border-2 border-success'}`}></div>
                      <div className={`w-3 h-3 rounded-full ${result.confidence === 'high' || result.confidence === 'moderate' ? 'bg-success' : 'border-2 border-success'}`}></div>
                      <div className={`w-3 h-3 rounded-full ${result.confidence === 'high' ? 'bg-success' : 'border-2 border-success'}`}></div>
                    </div>
                    <span className="text-xs font-bold text-success ml-1 uppercase tracking-wider">{result.confidence} Match</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={handleConfirmResult}
                  className="w-full py-4 bg-primary text-primary-content font-bold rounded-xl text-lg hover:brightness-110 active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  Yes, this is correct
                </button>
                <button 
                  onClick={() => setStep('manual')}
                  className="w-full py-4 border-2 border-primary text-primary font-bold rounded-xl text-lg hover:bg-primary/5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  No, let me fix it
                </button>
              </div>
            </div>
          )}

          {step === 'manual' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 text-warning bg-warning/10 p-3 rounded-lg border border-warning/30">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">Manually setting your crop will reset the automated growth stage tracking.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="manual-crop-select" className="font-bold text-sm">Crop Type</label>
                <select 
                  id="manual-crop-select"
                  className="p-3 border-2 border-neutral rounded-lg bg-surface text-lg font-medium outline-none focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors"
                  value={manualCrop}
                  onChange={(e) => setManualCrop(e.target.value)}
                >
                  <option value="wheat">Wheat</option>
                  <option value="rice">Rice</option>
                  <option value="maize">Maize</option>
                  <option value="cotton">Cotton</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="manual-stage-select" className="font-bold text-sm">Current Growth Stage</label>
                <select 
                  id="manual-stage-select"
                  className="p-3 border-2 border-neutral rounded-lg bg-surface text-lg font-medium outline-none focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors"
                  value={manualStage}
                  onChange={(e) => setManualStage(e.target.value)}
                >
                  <option value="germination">Germination (Just Sprouted)</option>
                  <option value="vegetative">Vegetative (Growing Leaves)</option>
                  <option value="flowering">Flowering / Heading</option>
                  <option value="maturity">Maturity (Ready for Harvest)</option>
                </select>
              </div>

              <button 
                onClick={handleManualSubmit}
                className="w-full mt-4 py-4 bg-primary text-primary-content font-bold rounded-xl text-lg hover:brightness-110 active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
