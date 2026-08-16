import cron from "node-cron";
import { runDailyWeatherIngestion } from "./ingestWeather.js";
import { runNightlyStageRecompute } from "./recomputeStages.js";

/**
 * AgriMesh Background Job Scheduler
 *
 * All scheduled jobs are registered here and start when the server starts.
 * Each job is logged with its name and schedule for observability.
 *
 * Schedule overview:
 * ┌─────────────────────────────────────────────────────┐
 * │ Job                    │ Schedule    │ UTC Time     │
 * ├─────────────────────────────────────────────────────┤
 * │ Weather Ingestion       │ 0 * * * *   │ Every hour   │
 * │ Stage Recompute         │ 0 1 * * *   │ 01:00 UTC    │
 * └─────────────────────────────────────────────────────┘
 */

export function startScheduler() {
  console.log("[Scheduler] Starting background job scheduler...");

  // ─── Weather Ingestion ─────────────────────────────────────────────────────
  // Every hour — keeps the 7-day forecast fresh for all fields.
  // Open-Meteo is free and generous; hourly ingestion is well within limits.
  cron.schedule(
    "0 * * * *",
    async () => {
      const label = "[Job:Weather]";
      console.log(
        `${label} Hourly ingestion triggered at ${new Date().toISOString()}`,
      );
      try {
        await runDailyWeatherIngestion();
      } catch (err) {
        console.error(`${label} Job crashed:`, err.message);
      }
    },
    { timezone: "UTC" },
  );

  // ─── Crop Stage Recompute ─────────────────────────────────────────────────
  // Every day at 01:00 UTC — recomputes GDD-based crop stage for all fields.
  // Runs after weather is guaranteed fresh (weather job runs at 00:00 UTC).
  cron.schedule(
    "0 1 * * *",
    async () => {
      const label = "[Job:Stages]";
      console.log(
        `${label} Nightly recompute triggered at ${new Date().toISOString()}`,
      );
      try {
        await runNightlyStageRecompute();
      } catch (err) {
        console.error(`${label} Job crashed:`, err.message);
      }
    },
    { timezone: "UTC" },
  );

  console.log(
    "[Scheduler] Registered 2 jobs: weather (hourly), stage-recompute (01:00 UTC daily)",
  );
}
