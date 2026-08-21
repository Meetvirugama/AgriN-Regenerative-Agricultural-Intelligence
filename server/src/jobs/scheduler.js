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

let isWeatherRunning = false;
  // ─── Weather Ingestion ─────────────────────────────────────────────────────
  cron.schedule(
    "0 * * * *",
    async () => {
      const label = "[Job:Weather]";
      if (isWeatherRunning) {
        console.warn(`${label} Previous run still active. Skipping this tick to prevent overlap.`);
        return;
      }
      isWeatherRunning = true;
      console.log(`${label} Hourly ingestion triggered at ${new Date().toISOString()}`);
      try {
        await runDailyWeatherIngestion();
      } catch (err) {
        console.error(`${label} Job crashed:`, err.message);
      } finally {
        isWeatherRunning = false;
      }
    },
    { timezone: "UTC" },
  );

  let isStagesRunning = false;
  // ─── Crop Stage Recompute ─────────────────────────────────────────────────
  cron.schedule(
    "0 1 * * *",
    async () => {
      const label = "[Job:Stages]";
      if (isStagesRunning) {
        console.warn(`${label} Previous run still active. Skipping this tick to prevent overlap.`);
        return;
      }
      isStagesRunning = true;
      console.log(`${label} Nightly recompute triggered at ${new Date().toISOString()}`);
      try {
        await runNightlyStageRecompute();
      } catch (err) {
        console.error(`${label} Job crashed:`, err.message);
      } finally {
        isStagesRunning = false;
      }
    },
    { timezone: "UTC" },
  );

  console.log(
    "[Scheduler] Registered 2 jobs: weather (hourly), stage-recompute (01:00 UTC daily)",
  );
}
