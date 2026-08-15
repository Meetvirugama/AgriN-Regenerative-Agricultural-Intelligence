import React from 'react';
import { FieldData, FarmerProfile } from '../types/field.types';
import { CheckCircle } from 'lucide-react';

interface ReviewScreenProps {
  farmer: Partial<FarmerProfile>;
  field: Partial<FieldData>;
  onConfirm: () => void;
  onBack: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ farmer, field, onConfirm, onBack }) => {
  return (
    <div className="animate-fade-in max-w-md mx-auto">
      <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-center">Review Details</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-surface p-4 border border-border">
          <h3 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Farmer</h3>
          <p className="font-bold uppercase text-lg">{farmer.name}</p>
          <p className="text-text-muted text-sm font-bold uppercase">{farmer.phone}</p>
        </div>

        <div className="bg-surface p-4 border border-border">
          <h3 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Field</h3>
          <p className="font-bold uppercase text-lg">{field.name}</p>
          <p className="text-text-muted text-sm font-bold uppercase">{field.areaHa} ha • {field.location || 'Location Set'}</p>
        </div>

        <div className="bg-surface p-4 border border-border">
          <h3 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Crop & Irrigation</h3>
          <p className="font-bold uppercase text-lg">{field.crop} {field.variety ? `(${field.variety})` : ''}</p>
          <p className="text-text-muted text-sm font-bold uppercase">Irrigation: {field.irrigation}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          className="btn btn-secondary flex-1" 
          onClick={onBack}
        >
          EDIT
        </button>
        <button 
          className="btn btn-primary flex-[2]" 
          onClick={onConfirm}
        >
          CREATE FIELD <CheckCircle size={18} />
        </button>
      </div>
    </div>
  );
};
