import React from 'react';
import { FieldData } from '../types/field.types';

interface CropSelectorProps {
  field: Partial<FieldData>;
  onChange: (updates: Partial<FieldData>) => void;
  onContinue: () => void;
}

export const CropSelector: React.FC<CropSelectorProps> = ({ field, onChange, onContinue }) => {
  const isValid = field.crop && field.crop.trim().length > 0;

  const commonCrops = [
    { name: 'Wheat', icon: '🌾' },
    { name: 'Rice', icon: '🌾' },
    { name: 'Maize', icon: '🌽' },
    { name: 'Pulses', icon: '🫘' },
    { name: 'Groundnut', icon: '🥜' },
  ];

  return (
    <div className="animate-fade-in max-w-md mx-auto text-center">
      <h2 className="text-xl font-bold uppercase tracking-wider mb-6">What are you growing?</h2>

      <div className="form-group mb-6 text-left">
        <label htmlFor="crop-search" className="form-label">Search crop</label>
        <input 
          id="crop-search"
          type="text" 
          className="form-input" 
          placeholder="WHEAT"
          value={field.crop || ''}
          onChange={(e) => onChange({ crop: e.target.value })}
        />
      </div>

      <div className="mb-8 text-left">
        <div className="text-xs font-bold uppercase text-text-muted mb-2">Common crops</div>
        <div className="flex flex-col gap-2">
          {commonCrops.map((c) => (
            <button
              key={c.name}
              className={`flex items-center gap-3 p-3 border transition-all ${
                field.crop === c.name ? 'border-border bg-text-main text-background font-bold' : 'border-border bg-background hover:bg-surface text-text-main'
              }`}
              onClick={() => onChange({ crop: c.name })}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="uppercase">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group mb-6 text-left">
        <label htmlFor="crop-variety" className="form-label">Variety <span className="text-text-muted font-normal normal-case">(Optional)</span></label>
        <input 
          id="crop-variety"
          type="text" 
          className="form-input" 
          placeholder="LOKWAN"
          value={field.variety || ''}
          onChange={(e) => onChange({ variety: e.target.value })}
        />
      </div>

      <div className="form-group mb-8 text-left">
        <label htmlFor="sowing-date" className="form-label">Sowing date</label>
        <input 
          id="sowing-date"
          type="date" 
          className="form-input" 
          value={field.sowingDate || ''}
          onChange={(e) => onChange({ sowingDate: e.target.value })}
        />
      </div>

      <button 
        className="btn btn-primary w-full" 
        onClick={onContinue}
        disabled={!isValid}
      >
        CONTINUE →
      </button>
    </div>
  );
};
