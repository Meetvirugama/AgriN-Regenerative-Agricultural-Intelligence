import { SatelliteTile, SubregionValue } from './satellite.types';

export interface SatelliteProvider {
  fetchLatestTile(fieldBoundary: any, fieldId: string): Promise<SatelliteTile | null>;
  getHistoricalTiles(fieldId: string, from: string, to: string): Promise<SatelliteTile[]>;
}

export class MockSatelliteProvider implements SatelliteProvider {
  private generateMockSubregions(): SubregionValue[] {
    const labels = ['Northeast', 'Northwest', 'Southeast', 'Southwest', 'Center'];
    return labels.map((label, index) => ({
      subregionId: `sub-${index}`,
      geometry: { type: 'Polygon', coordinates: [] }, // Mock geometry
      ndvi: 0.6 + (Math.random() * 0.2 - 0.1), // Base NDVI around 0.6 +/- 0.1
      label
    }));
  }

  private createMockTile(fieldId: string, date: string, options?: Partial<SatelliteTile>): SatelliteTile {
    const subregions = this.generateMockSubregions();
    const ndviMean = subregions.reduce((sum, s) => sum + s.ndvi, 0) / subregions.length;
    
    return {
      id: `tile-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      fieldId,
      captureDate: date,
      provider: 'mock',
      ndviMean,
      ndviBySubregion: subregions,
      moistureProxy: 0.5 + (Math.random() * 0.3 - 0.15), // Base moisture around 0.5 +/- 0.15
      cloudCoverPct: Math.random() > 0.8 ? (Math.random() * 100) : (Math.random() * 10), // Mostly clear, sometimes cloudy
      tileUrl: null,
      ingestedAt: new Date().toISOString(),
      ...options
    };
  }

  async fetchLatestTile(fieldBoundary: any, fieldId: string): Promise<SatelliteTile | null> {
    // Simulate a recent pass
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 3)); // 0-3 days ago
    
    // Simulate 20% chance of being too cloudy
    const isCloudy = Math.random() < 0.2;
    if (isCloudy) {
       return this.createMockTile(fieldId, date.toISOString(), { cloudCoverPct: 80 + Math.random() * 20 });
    }

    return this.createMockTile(fieldId, date.toISOString());
  }

  async getHistoricalTiles(fieldId: string, from: string, to: string): Promise<SatelliteTile[]> {
    const tiles: SatelliteTile[] = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Generate a tile roughly every 5 days
    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      tiles.push(this.createMockTile(fieldId, currentDate.toISOString()));
      currentDate.setDate(currentDate.getDate() + 5);
    }
    
    return tiles;
  }
}
