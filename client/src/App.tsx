import React, { useState } from 'react';
import { FieldOnboardingFlow, FieldCard, FieldData } from '@/features/field-foundation';
import { SatelliteHealthCard, SatelliteDetailView, useSatelliteHealth } from '@/features/satellite-health';
import { Plus, ArrowLeft } from 'lucide-react';

export default function App() {
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [fields, setFields] = useState<FieldData[]>([
    {
      id: 'mock-field-1',
      name: 'North Plot',
      crop: 'Wheat',
      areaHa: 1.2,
      irrigation: 'rainfed',
      boundary: [
        { lat: 20.593, lng: 78.962 },
        { lat: 20.594, lng: 78.962 },
        { lat: 20.594, lng: 78.963 },
        { lat: 20.593, lng: 78.963 },
      ]
    }
  ]);
  const [selectedField, setSelectedField] = useState<FieldData | null>(null);

  if (isOnboarding) {
    return (
      <main className="main-content bg-background">
        <FieldOnboardingFlow onComplete={() => setIsOnboarding(false)} />
      </main>
    );
  }

  if (selectedField) {
    // Field Dashboard View (where all layers come together)
    return (
      <main className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border">
           <button onClick={() => setSelectedField(null)} className="hover:bg-surface p-2 border border-border">
             <ArrowLeft size={20} />
           </button>
           <div>
             <h2 className="text-2xl font-bold uppercase tracking-wider">{selectedField.name}</h2>
             <p className="text-sm font-bold text-text-muted uppercase tracking-widest">{selectedField.crop} · {selectedField.areaHa} HA</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Layer 05: Satellite Health Card */}
           <FieldSatelliteWrapper field={selectedField} />
           
           {/* Other layer cards would go here... */}
        </div>
      </main>
    );
  }

  // Dashboard / Layer 02 entry point
  return (
    <main className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-12 border-b border-black pb-8">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">My Fields</h2>
          <p className="text-text-muted font-bold uppercase tracking-widest text-sm">Manage your agricultural profile and fields</p>
        </div>
        <button 
          className="btn btn-primary w-auto"
          onClick={() => setIsOnboarding(true)}
        >
          <Plus size={18} /> ADD NEW FIELD
        </button>
      </div>

      <div className="dashboard-grid">
        {fields.length > 0 ? (
          fields.map((f, i) => (
            <FieldCard key={f.id || i} field={f} onClick={() => setSelectedField(f)} />
          ))
        ) : (
          <div className="col-span-full p-12 text-center border border-black bg-surface uppercase font-bold text-text-muted tracking-widest">
            <p className="mb-6 text-sm">You have completed onboarding, but no mock fields were saved to state yet.</p>
            <button className="btn btn-secondary w-auto mx-auto" onClick={() => setIsOnboarding(true)}>
              START ONBOARDING FLOW AGAIN
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Wrapper to handle data fetching for the card and modal state
const FieldSatelliteWrapper = ({ field }: { field: FieldData }) => {
  const [showDetail, setShowDetail] = useState(false);
  const { data, loading, error } = useSatelliteHealth(field.id);
  
  if (error) {
    return <div className="border border-danger p-4 text-danger text-sm">Failed to load satellite data.</div>;
  }
  
  return (
    <>
      <SatelliteHealthCard 
        data={data} 
        loading={loading} 
        onClick={() => setShowDetail(true)} 
      />
      {showDetail && (
        <SatelliteDetailView 
          fieldId={field.id!} 
          fieldBoundary={field.boundary}
          onClose={() => setShowDetail(false)} 
        />
      )}
    </>
  );
}
