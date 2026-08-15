export type StatusLevel = 'healthy' | 'neutral' | 'info' | 'attention' | 'urgent';

export const mapSeverityToStatus = (severity: string): StatusLevel => {
  const normalized = severity.toLowerCase();
  if (normalized === 'green' || normalized === 'low' || normalized === 'healthy') return 'healthy';
  if (normalized === 'amber' || normalized === 'moderate' || normalized === 'medium' || normalized === 'attention') return 'attention';
  if (normalized === 'red' || normalized === 'high' || normalized === 'urgent') return 'urgent';
  if (normalized === 'info') return 'info';
  return 'neutral';
};
