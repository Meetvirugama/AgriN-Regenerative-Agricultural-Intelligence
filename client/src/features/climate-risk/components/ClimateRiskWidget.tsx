import { useEffect, useState } from 'react';
import { AlertTriangle, ThermometerSun } from 'lucide-react';
import { ClimateRiskData } from '../types';
import { request } from '../../../services/apiClient';
import { cn } from '../../../lib/cn';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { mapSeverityToStatus } from '../../../types/status';

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
    return <LoadingSkeleton message="Analyzing climate risks..." />;
  }

  if (error || !data) {
    return <ErrorState title="Unable to load climate risk" message={error || 'No data available'} />;
  }

  const status = mapSeverityToStatus(data.severity);
  
  const getSeverityColors = (statusLevel: string) => {
    switch (statusLevel) {
      case 'urgent':
        return 'bg-danger/10 border-danger/30 text-danger';
      case 'attention':
        return 'bg-warning/10 border-warning/30 text-warning';
      case 'info':
        return 'bg-info/10 border-info/30 text-info';
      case 'healthy':
        return 'bg-success/10 border-success/30 text-success';
      default:
        return 'bg-neutral/10 border-neutral/30 text-text-muted';
    }
  };

  return (
    <Card className={cn(
      'transition-all',
      getSeverityColors(status)
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface rounded-lg shadow-sm border border-border">
            {data.riskType === 'Heatwave' ? (
              <ThermometerSun className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight tracking-tight uppercase">
              {data.riskType} Warning
            </h3>
            <p className="text-sm font-medium opacity-80">{data.timeframe}</p>
          </div>
        </div>
        
        <StatusBadge status={status}>
          {data.severity} Risk
        </StatusBadge>
      </div>

      <div className="bg-surface/60 rounded-lg p-4 text-sm font-medium leading-relaxed border border-border/50 text-text">
        <strong className="block text-text-muted text-xs uppercase tracking-wider mb-1">Recommended Action</strong>
        {data.protectiveAction}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs text-text-muted font-bold tracking-wider uppercase">
        <span>AI-Generated Prediction</span>
        <span>Updated: {new Date(data.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    </Card>
  );
}
