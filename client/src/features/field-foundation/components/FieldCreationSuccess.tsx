import React from 'react';
import { FieldData } from '../types/field.types';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface FieldCreationSuccessProps {
  field: Partial<FieldData>;
  onViewField: () => void;
}

export const FieldCreationSuccess: React.FC<FieldCreationSuccessProps> = ({ field, onViewField }) => {
  return (
    <div className="animate-fade-in max-w-md mx-auto text-center flex flex-col items-center">
      <div className="border border-border p-4 mb-6">
        <CheckCircle2 size={48} className="text-text-main" />
      </div>
      
      <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Your field is ready</h2>
      
      <div className="bg-surface p-6 w-full text-left mb-8 border border-border">
        <h3 className="text-lg font-bold uppercase mb-1">{field.name}</h3>
        <p className="text-text-muted mb-4 font-bold uppercase">{field.areaHa} hectares • {field.crop}</p>
        
        <p className="text-xs text-text-muted border-t border-border pt-4 font-bold uppercase">
          AgriMesh can now start understanding your field.
        </p>
      </div>

      <button 
        className="btn btn-primary w-full py-4" 
        onClick={onViewField}
      >
        VIEW MY FIELD <ArrowRight size={20} />
      </button>
    </div>
  );
};
