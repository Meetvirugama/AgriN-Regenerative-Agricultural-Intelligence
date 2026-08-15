import React, { useEffect, useState } from 'react';
import { Sprout, ArrowRight, Leaf } from 'lucide-react';
import { regenApi, RegenPlan } from '../api/regenApi';
import { CropPlanningModal } from './CropPlanningModal';

interface RegenPlanningCardProps {
  fieldId: string;
}

export function RegenPlanningCard({ fieldId }: RegenPlanningCardProps) {
  const [plan, setPlan] = useState<RegenPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchPlan() {
      try {
        const data = await regenApi.getRegenPlan(fieldId);
        if (mounted) setPlan(data);
      } catch (err) {
        console.error(err);
        if (mounted) setError('Could not load planning insights');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPlan();
    return () => { mounted = false; };
  }, [fieldId]);

  if (loading) {
    return (
      <div className="bg-surface border border-neutral p-6 rounded-xl shadow-sm animate-pulse">
        <div className="h-6 w-1/2 bg-neutral/20 rounded mb-4"></div>
        <div className="h-16 bg-neutral/20 rounded"></div>
      </div>
    );
  }

  if (error || !plan) {
    return null;
  }

  const topPractice = plan.practices[0];

  return (
    <div className="bg-surface border border-primary/30 p-6 rounded-xl shadow-sm relative overflow-hidden">
      <div className="absolute -top-4 -right-4 text-primary/10">
        <Leaf size={120} />
      </div>

      <div className="relative z-10">
        <h3 className="font-bold mb-4 tracking-wide text-sm text-primary uppercase flex items-center gap-2">
          <Sprout size={16} /> Soil Health & Future Planning
        </h3>

        {topPractice && (
          <div className="mb-6">
            <h4 className="text-xl font-bold mb-2">{topPractice.title}</h4>
            <p className="text-text-muted text-sm leading-relaxed mb-3">
              {topPractice.reasoning}
            </p>
            <div className="inline-block px-2 py-1 bg-background border border-neutral rounded text-xs font-bold text-text-muted uppercase tracking-wider">
              Effort: {topPractice.effort_level}
            </div>
          </div>
        )}

        <button 
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-background border-2 border-primary text-primary font-bold rounded-xl text-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          Explore Next Season Options <ArrowRight size={16} />
        </button>
      </div>

      {showModal && (
        <CropPlanningModal 
          options={plan.next_season_options} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}
