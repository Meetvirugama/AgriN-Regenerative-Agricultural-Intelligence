export interface SubregionValue {
  subregionId: string;
  geometry: any; // using any for GeoJSON.Polygon to avoid complex typing for now, will refine if needed
  ndvi: number;
  label: string; // 'northeast' | 'northwest' | etc.
}

export interface SatelliteTile {
  id: string;
  fieldId: string;
  captureDate: string; // ISO date
  provider: string; // 'sentinel-2' | 'mock'
  ndviMean: number; // -1 to 1
  ndviBySubregion: SubregionValue[]; // grid of values within field
  moistureProxy: number; // 0-1
  cloudCoverPct: number; // 0-100
  tileUrl: string | null; // rendered tile image URL
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
  subregionGeometry: any; // GeoJSON.Polygon
  subregionLabel: string;
  detectedDate: string;
  anomalyType: 'vegetation_decline' | 'moisture_drop';
  severity: 'low' | 'moderate' | 'high';
  stillActive: boolean;
  resolvedDate: string | null;
}
