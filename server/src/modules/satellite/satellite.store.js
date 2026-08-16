export class SatelliteStore {
  tiles = [];
  trends = [];
  anomalies = [];

  // No pre-seeded data — anomalies are created by real satellite ingestion per field.
  // Seeding with a hardcoded field ID caused satellite health to always reference
  // a non-existent field, producing incorrect data for every real field.
  constructor() {}

  async saveTile(tile) {
    this.tiles.push(tile);
  }

  async getLatestTile(fieldId) {
    const fieldTiles = this.tiles
      .filter((t) => t.fieldId === fieldId && t.cloudCoverPct < 50) // Only clear-ish tiles
      .sort(
        (a, b) =>
          new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime(),
      );
    return fieldTiles[0] || null;
  }

  async getHistoricalTiles(fieldId, limit = 5) {
    return this.tiles
      .filter((t) => t.fieldId === fieldId)
      .sort(
        (a, b) =>
          new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime(),
      )
      .slice(0, limit);
  }

  async saveTrend(trend) {
    this.trends.push(trend);
  }

  async getLatestTrend(fieldId) {
    const fieldTrends = this.trends
      .filter((t) => t.fieldId === fieldId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return fieldTrends[0] || null;
  }
  async getTrendsTime_series(fieldId) {
    return this.trends
      .filter((t) => t.fieldId === fieldId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending for chart
  }

  async saveAnomaly(anomaly) {
    this.anomalies.push(anomaly);
  }

  async getActiveAnomalies(fieldId) {
    return this.anomalies.filter((a) => a.fieldId === fieldId && a.stillActive);
  }

  async getAllAnomalies(fieldId) {
    return this.anomalies.filter((a) => a.fieldId === fieldId);
  }
}

export const satelliteStore = new SatelliteStore();
