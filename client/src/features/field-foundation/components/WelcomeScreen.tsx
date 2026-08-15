import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onContinue: () => void;
  onVoice: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue, onVoice }) => {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <h1 className="title mb-4">CREATE YOUR<br />FIELD INTELLIGENCE</h1>
      
      <div className="flex flex-col gap-2 mb-8 text-lg font-medium">
        <p>Tell us who you are.</p>
        <p>We'll build the rest around your field.</p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <button 
          onClick={onContinue}
          className="btn btn-primary w-full py-4 text-lg font-bold"
        >
          CONTINUE <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
