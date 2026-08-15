import { db } from '../models/Database';
import { layer2Service } from '../modules/crop/crop.service';

/**
 * Recompute Job
 * As per Layer 02 Prompt requirement: 
 * "Nightly batch job (or on-demand recompute) that updates current_stage for all active fields."
 * 
 * This script can be run on a cron schedule (e.g. via node-cron or a serverless function invocation).
 */
export async function runNightlyStageRecompute() {
  console.log('Starting nightly stage recompute job...');
  let updatedCount = 0;
  let errorCount = 0;

  // In a real application, you'd fetch active fields from the database.
  // Here we iterate over the in-memory map.
  for (const [fieldId, field] of db.fields.entries()) {
    try {
      // getFieldCropState has the on-demand recompute logic built-in.
      // Calling it automatically refreshes the state in the database if the calendar changed.
      const state = layer2Service.getFieldCropState(fieldId);
      updatedCount++;
      console.log(`Recomputed field ${fieldId}: Now at ${state.current_stage} stage.`);
    } catch (err: any) {
      errorCount++;
      console.error(`Error recomputing field ${fieldId}:`, err.message);
    }
  }

  console.log(`Job complete. Updated: ${updatedCount}, Errors: ${errorCount}`);
}

// If run directly (e.g., node recomputeStages.js)
if (require.main === module) {
  runNightlyStageRecompute().then(() => process.exit(0));
}
