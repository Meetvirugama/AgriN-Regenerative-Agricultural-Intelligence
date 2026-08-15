import React from 'react';
import { FieldData } from '../types/field.types';

interface IrrigationSelectorProps {
  field: Partial<FieldData>;
  onChange: (updates: Partial<FieldData>) => void;
  onContinue: () => void;
}

export const IrrigationSelector: React.FC<IrrigationSelectorProps> = ({ field, onChange, onContinue }) => {
  const isValid = field.irrigation && field.irrigation.length > 0;

  const irrigationSources = [
    'Rainfed',
    'Borewell',
    'Canal',
    'Drip / Sprinkler',
    'Other'
  ];

  return (
    <div className="animate-fade-in max-w-md mx-auto text-center">
      <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Irrigation</h2>

      <div className="mb-8 text-left">
        <div className="text-xs font-bold uppercase text-text-muted mb-2">Select primary water source</div>
        <div className="flex flex-col gap-2">
          {irrigationSources.map((source) => (
            <button
              key={source}
              className={`flex items-center gap-3 p-4 border transition-all ${
                field.irrigation === source ? 'border-border bg-text-main text-background font-bold' : 'border-border bg-background hover:bg-surface text-text-main'
              }`}
              onClick={() => onChange({ irrigation: source })}
            >
              <div className={`w-4 h-4 border flex items-center justify-center ${
                field.irrigation === source ? 'border-white' : 'border-border'
              }`}>
                {field.irrigation === source && <div className="w-2 h-2 bg-background" />}
              </div>
              <span className="uppercase">{source}</span>
            </button>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-primary w-full" 
        onClick={onContinue}
        disabled={!isValid}
      >
        REVIEW DETAILS →
      </button>
    </div>
  );
};
