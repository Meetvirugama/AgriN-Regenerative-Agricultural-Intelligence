import { layer3Service } from "../modules/weather/weather.service.js";
import { pool } from "../db/connection.js";

/**
 * Daily Weather Ingestion Job
 *
 * Fetches fresh 7-day forecast from Open-Meteo for every field in the DB,
 * evaluates the rule engine, and persists weather event flags.
 * Runs nightly via the cron scheduler in scheduler.ts.
 *
 * Processes fields in parallel batches (CONCURRENCY=5) to avoid sequential
 * slowness for large farmer bases while still rate-limiting API calls.
 */

const CONCURRENCY = 5;

/**
 * Process an array of items with a bounded concurrency cap.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<void>} fn
 * @param {number} concurrency
 */
async function mapWithConcurrency(items, fn, concurrency) {
  const results = [];
  const executing = new Set();
  for (const item of items) {
    const p = fn(item).finally(() => executing.delete(p));
    results.push(p);
    executing.add(p);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  return Promise.allSettled(results);
}

export async function runDailyWeatherIngestion() {
  console.log("[Job:Weather] Starting daily weather ingestion...");
  let updatedCount = 0;
  let errorCount = 0;

  // Query all field IDs directly — avoids loading full Field objects
  const { rows } = await pool.query(
    "SELECT id, name FROM fields ORDER BY created_at ASC",
  );

  if (rows.length === 0) {
    console.log("[Job:Weather] No fields found. Nothing to do.");
    return;
  }

  console.log(`[Job:Weather] Processing ${rows.length} fields (concurrency=${CONCURRENCY})...`);

  await mapWithConcurrency(
    rows,
    async (row) => {
      try {
        const { forecasts, flags } = await layer3Service.fetchAndStoreForecast(row.id);
        updatedCount++;
        console.log(
          `[Job:Weather] Field "${row.name}" (${row.id}): ${forecasts.length} forecasts, ${flags.length} flags`,
        );
      } catch (err) {
        errorCount++;
        console.error(`[Job:Weather] Error for field ${row.id}:`, err.message);
      }
    },
    CONCURRENCY,
  );

  console.log(
    `[Job:Weather] Done. Updated: ${updatedCount}, Errors: ${errorCount}, Total: ${rows.length}`,
  );
}

// If run directly: node src/jobs/ingestWeather.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDailyWeatherIngestion()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
