import { useEffect, useState } from 'react';
import { AlertTriangle, ThermometerSun, Loader2 } from 'lucide-react';
import { ClimateRiskData } from '../types';
import { request } from '../../../services/apiClient';
import { cn } from '../../../lib/cn';

interface ClimateRiskWidgetProps {
  fieldId: string;
}

export function ClimateRiskWidget({ fieldId }: ClimateRiskWidgetProps) {
  const [data, setData] = useState<ClimateRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const result = await request<ClimateRiskData>(`fields/${fieldId}/climate-risk`);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRisk();
  }, [fieldId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-2" />
        <span className="text-slate-500">Analyzing climate risks...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start">
        <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-red-900">Unable to load climate risk</h4>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Medium':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Low':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className={cn(
      'rounded-xl border p-5 shadow-sm transition-all',
      getSeverityColors(data.severity)
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-current/10">
            {data.riskType === 'Heatwave' ? (
              <ThermometerSun className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight tracking-tight">
              {data.riskType} Warning
            </h3>
            <p className="text-sm font-medium opacity-80">{data.timeframe}</p>
          </div>
        </div>
        
        <span className={cn(
          'px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border',
          getSeverityBadge(data.severity)
        )}>
          {data.severity} Risk
        </span>
      </div>

      <div className="bg-white/60 rounded-lg p-4 text-sm font-medium leading-relaxed border border-white">
        <strong className="block text-current/80 text-xs uppercase tracking-wider mb-1">Recommended Action</strong>
        {data.protectiveAction}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs opacity-70">
        <span>AI-Generated Prediction</span>
        <span>Updated: {new Date(data.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    </div>
  );
}
