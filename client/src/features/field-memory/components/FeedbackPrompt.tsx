import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Camera } from 'lucide-react';
import { PendingPrompt } from '../types';
import { memoryApi } from '../api/memoryApi';
import { TextToSpeechButton } from '../../voice/components/TextToSpeechButton';

interface FeedbackPromptProps {
  prompt: PendingPrompt;
  onDismiss: () => void;
}

export const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ prompt, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<'helped' | 'didnt_help' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponse = (type: 'helped' | 'didnt_help') => {
    setSelectedResponse(type);
    setExpanded(true);
  };

  const handleSubmit = async () => {
    if (!selectedResponse) return;
    setIsSubmitting(true);
    await memoryApi.submitFeedback(prompt.advisory_id, prompt.field_id, selectedResponse, note);
    setIsSubmitting(false);
    onDismiss();
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <div className="bg-surface border-2 border-primary/50 p-5 rounded-2xl shadow-lg mb-6 animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-black text-lg tracking-tight text-text flex items-center gap-2">
          Did this advice help?
          <TextToSpeechButton 
            textToRead={`Did this advice help? ${prompt.summary}`} 
            className="w-7 h-7 p-1" 
          />
        </h3>
        <button onClick={handleSkip} className="text-text-muted hover:bg-neutral/20 p-1 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <p className="text-sm font-medium text-text-muted mb-4">"{prompt.summary}"</p>

      {!expanded ? (
        <div className="flex gap-3 mt-4">
          <button 
            onClick={() => handleResponse('helped')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-success/10 text-success hover:bg-success/20 border border-success/30 rounded-xl font-bold transition-colors"
          >
            <ThumbsUp size={20} /> Yes, it helped
          </button>
          <button 
            onClick={() => handleResponse('didnt_help')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-error/10 text-error hover:bg-error/20 border border-error/30 rounded-xl font-bold transition-colors"
          >
            <ThumbsDown size={20} /> Not really
          </button>
        </div>
      ) : (
        <div className="mt-4 animate-fade-in-up">
          <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
            Add a quick note or photo (Optional)
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="What actually happened?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 bg-background border border-neutral/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button className="bg-neutral/10 text-text-muted border border-neutral/30 p-2 rounded-xl hover:bg-neutral/20 transition-colors">
              <Camera size={20} />
            </button>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
};
