import React from 'react';
import { FarmerProfile } from '../types/field.types';

interface FarmerProfileFormProps {
  farmer: Partial<FarmerProfile>;
  onChange: (updates: Partial<FarmerProfile>) => void;
  onContinue: () => void;
}

export const FarmerProfileForm: React.FC<FarmerProfileFormProps> = ({ farmer, onChange, onContinue }) => {
  const isValid = farmer.name && farmer.phone && farmer.language;

  return (
    <div className="animate-fade-in max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Create your field intelligence</h2>
        <p className="text-text-muted">Tell us who you are. We'll build the rest around your field.</p>
      </div>

      <div className="form-group mb-6">
        <label htmlFor="farmer-name" className="form-label">Name</label>
        <input 
          id="farmer-name"
          type="text" 
          className="form-input" 
          placeholder="Meet"
          value={farmer.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="form-group mb-6">
        <label htmlFor="farmer-phone" className="form-label">Phone</label>
        <input 
          id="farmer-phone"
          type="tel" 
          className="form-input" 
          placeholder="+91 XXXXX XXXXX"
          value={farmer.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </div>

      <div className="form-group mb-8">
        <label htmlFor="farmer-lang" className="form-label">Language</label>
        <select 
          id="farmer-lang"
          className="form-select"
          value={farmer.language || 'English'}
          onChange={(e) => onChange({ language: e.target.value })}
        >
          <option value="English">English</option>
          <option value="ગુજરાતી">ગુજરાતી</option>
          <option value="हिंदी">हिंदी</option>
        </select>
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
