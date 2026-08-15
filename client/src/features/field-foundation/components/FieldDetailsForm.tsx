import React from 'react';
import { FieldData } from '../types/field.types';

interface FieldDetailsFormProps {
  field: Partial<FieldData>;
  onChange: (updates: Partial<FieldData>) => void;
  onContinue: () => void;
}

export const FieldDetailsForm: React.FC<FieldDetailsFormProps> = ({ field, onChange, onContinue }) => {
  const isValid = field.name && field.name.trim().length > 0;

  return (
    <div className="animate-fade-in max-w-md mx-auto text-center">
      <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Field details</h2>

      <div className="form-group mb-6 text-left">
        <label htmlFor="field-name" className="form-label">Field name</label>
        <input 
          id="field-name"
          type="text" 
          className="form-input" 
          placeholder="NORTH FIELD"
          value={field.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="bg-surface p-4 mb-4 text-left border border-border">
        <div className="text-xs font-bold uppercase text-text-muted mb-1">Area</div>
        <div className="text-lg font-bold uppercase">{field.areaHa || 0} ha</div>
      </div>

      <div className="bg-surface p-4 mb-8 text-left border border-border">
        <div className="text-xs font-bold uppercase text-text-muted mb-1">Location</div>
        <div className="text-lg font-bold uppercase">{field.location || 'Current Location'}</div>
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
