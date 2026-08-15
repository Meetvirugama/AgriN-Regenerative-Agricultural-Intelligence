import React, { useState } from 'react';
import { FieldOnboardingFlow, FieldCard, FieldData } from '@/features/field-foundation';
import { Plus } from 'lucide-react';

export default function App() {
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [fields, setFields] = useState<FieldData[]>([]); // In reality, this would come from an API/context

  if (isOnboarding) {
    return (
      <main className="main-content bg-background">
        <FieldOnboardingFlow onComplete={() => setIsOnboarding(false)} />
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
            <FieldCard key={f.id || i} field={f} onClick={() => console.log('Open field', f)} />
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
