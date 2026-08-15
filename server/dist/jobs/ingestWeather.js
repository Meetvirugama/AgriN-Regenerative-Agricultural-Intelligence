"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDailyWeatherIngestion = runDailyWeatherIngestion;
const Database_1 = require("../models/Database");
const Layer3Service_1 = require("../services/Layer3Service");
/**
 * Ingestion Job
 * "Ingest short-range (7-day) and medium-range (14–30 day) forecasts on a scheduled job"
 *
 * This script runs daily to fetch the latest weather from the provider,
 * run the rules engine, and store updated flags.
 */
async function runDailyWeatherIngestion() {
    console.log('Starting daily weather ingestion job...');
    let updatedCount = 0;
    let errorCount = 0;
    for (const [fieldId, field] of Database_1.db.fields.entries()) {
        try {
            await Layer3Service_1.layer3Service.fetchAndStoreForecast(fieldId);
            updatedCount++;
            console.log(`Ingested weather for field ${fieldId}.`);
        }
        catch (err) {
            errorCount++;
            console.error(`Error ingesting weather for field ${fieldId}:`, err.message);
        }
    }
    console.log(`Job complete. Updated: ${updatedCount}, Errors: ${errorCount}`);
}
// If run directly
if (require.main === module) {
    runDailyWeatherIngestion().then(() => process.exit(0));
}
