import React from 'react';
import { FieldData } from '../types/field.types';
import { MapPin } from 'lucide-react';

interface FieldCardProps {
  field: FieldData;
  onClick?: () => void;
}

export const FieldCard: React.FC<FieldCardProps> = ({ field, onClick }) => {
  return (
    <div 
      className={`bg-background border border-border ${onClick ? 'cursor-pointer hover:bg-surface transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="border-b border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted">
        FIELD
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold uppercase mb-4">{field.name}</h3>
        
        <div className="space-y-1 mb-6">
          <p className="font-bold uppercase">{field.crop} {field.variety ? `(${field.variety})` : ''}</p>
          <p className="text-text-muted font-bold uppercase">{field.areaHa} HA</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-bold uppercase">
          <span className="text-success text-lg">●</span>
          <span>REGISTERED</span>
        </div>
      </div>
    </div>
  );
};
