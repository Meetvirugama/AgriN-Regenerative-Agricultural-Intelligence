export type RiskSeverity = 'High' | 'Medium' | 'Low';

export interface ClimateRiskData {
  fieldId: string;
  riskType: string;
  severity: RiskSeverity;
  timeframe: string;
  protectiveAction: string;
  generatedAt: string;
}
