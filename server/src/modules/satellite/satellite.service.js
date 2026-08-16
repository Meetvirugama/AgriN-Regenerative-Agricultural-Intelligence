import { MockSatelliteProvider } from "./satellite.provider.js";
import { satelliteStore } from "./satellite.store.js";
import { PythonClient } from "../../services/pythonClient.js";

export class SatelliteService {
  constructor() {
    // In production, we'd inject this via DI. Using mock for now.
    this.provider = new MockSatelliteProvider();
  }

  async ingestLatestForField(fieldId, fieldBoundary) {
    // 1. Fetch latest tile
    const newTile = await this.provider.fetchLatestTile(fieldBoundary, fieldId);
    if (!newTile) return;

    await satelliteStore.saveTile(newTile);

    // If cloudy, we skip trend/anomaly calculation on this pass
    if (newTile.cloudCoverPct >= 50) return;

    // 2. Fetch history for trend calculation
    const history = await satelliteStore.getHistoricalTiles(fieldId, 3);
    // 3. Process via Python (Trend & Anomalies)
    const result = await PythonClient.processSatelliteData(
      fieldId,
      newTile,
      history,
    );

    if (result.trend) {
      await satelliteStore.saveTrend(result.trend);
    }

    if (result.anomalies && result.anomalies.length > 0) {
      for (const anomaly of result.anomalies) {
        await satelliteStore.saveAnomaly(anomaly);
      }
    }
  }
}

export const satelliteService = new SatelliteService();
