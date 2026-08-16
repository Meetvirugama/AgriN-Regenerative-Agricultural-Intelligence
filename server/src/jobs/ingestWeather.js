import { layer3Service } from "../modules/weather/weather.service.js";
import { pool } from "../db/connection.js";

/**
 * Daily Weather Ingestion Job
 *
 * Fetches fresh 7-day forecast from Open-Meteo for every field in the DB,
 * evaluates the rule engine, and persists weather event flags.
 * Runs nightly via the cron scheduler in scheduler.ts.
 */
export async function runDailyWeatherIngestion() {
  console.log("[Job:Weather] Starting daily weather ingestion...");
  let updatedCount = 0;
  let errorCount = 0;

  // Query all field IDs directly — avoids loading full Field objects
  const { rows } = await pool.query(
    "SELECT id, name FROM fields ORDER BY created_at ASC",
  );

  for (const row of rows) {
    try {
      const { forecasts, flags } = await layer3Service.fetchAndStoreForecast(
        row.id,
      );
      updatedCount++;
      console.log(
        `[Job:Weather] Field "${row.name}" (${row.id}): ${forecasts.length} forecasts, ${flags.length} flags`,
      );
    } catch (err) {
      errorCount++;
      console.error(`[Job:Weather] Error for field ${row.id}:`, err.message);
    }
  }

  console.log(
    `[Job:Weather] Done. Updated: ${updatedCount}, Errors: ${errorCount}`,
  );
}

// If run directly: npx tsx src/jobs/ingestWeather.ts
if (require.main === module) {
  runDailyWeatherIngestion()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
