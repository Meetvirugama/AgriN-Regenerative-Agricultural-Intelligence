import { layer2Service } from "../modules/crop/crop.service.js";
import { fieldRepo } from "../db/repositories/farmerRepository.js";

/**
 * Nightly Stage Recompute Job
 *
 * As per Layer 02 requirement: updates current_stage for all active fields.
 * This script can be run on a cron schedule or called directly.
 * Phase 5 will hook this into a proper job scheduler.
 */
export async function runNightlyStageRecompute() {
  console.log("[Job] Starting nightly stage recompute...");
  let updatedCount = 0;
  let errorCount = 0;

  // TODO: In Phase 5, filter to only active fields (not harvested/archived)
  // For now we iterate all fields in the DB — still correct, just no filter yet.
  const allFields = await fieldRepo.findFieldsByFarmer(""); // Phase 5: paginate all farmers

  for (const field of allFields) {
    try {
      const state = await layer2Service.getFieldCropState(field.id);
      updatedCount++;
      console.log(
        `[Job] Field ${field.id} (${field.name}): ${state.current_stage}`,
      );
    } catch (err) {
      errorCount++;
      console.error(`[Job] Error recomputing field ${field.id}:`, err.message);
    }
  }

  console.log(`[Job] Done. Updated: ${updatedCount}, Errors: ${errorCount}`);
}

// If run directly (npx tsx src/jobs/recomputeStages.ts)
if (require.main === module) {
  runNightlyStageRecompute()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
