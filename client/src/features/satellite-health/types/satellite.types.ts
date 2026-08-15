export interface SubregionValue {
  subregionId: string;
  geometry: any;
  ndvi: number;
  label: string;
}

export interface SatelliteTile {
  id: string;
  fieldId: string;
  captureDate: string;
  provider: string;
  ndviMean: number;
  ndviBySubregion: SubregionValue[];
  moistureProxy: number;
  cloudCoverPct: number;
  tileUrl: string | null;
  ingestedAt: string;
}

export interface FieldHealthTrend {
  fieldId: string;
  date: string;
  ndviTrendDirection: 'improving' | 'stable' | 'declining';
  moistureTrend: 'improving' | 'stable' | 'declining';
  ndviValue: number;
  moistureValue: number;
  summaryText: string;
  computedAt: string;
}

export interface AnomalyFlag {
  id: string;
  fieldId: string;
  subregionGeometry: any;
  subregionLabel: string;
  detectedDate: string;
  anomalyType: 'vegetation_decline' | 'moisture_drop';
  severity: 'low' | 'moderate' | 'high';
  stillActive: boolean;
  resolvedDate: string | null;
}

export interface SatelliteHealthData {
  latestTile: SatelliteTile | null;
  trend: FieldHealthTrend | null;
  activeAnomalies: AnomalyFlag[];
}
