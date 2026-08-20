import { layer2Service } from "../modules/crop/crop.service.js";
import { fieldRepo } from "../db/repositories/farmerRepository.js";

/**
 * Nightly Stage Recompute Job
 *
 * As per Layer 02 requirement: updates current_stage for all active fields.
 * Processes fields in parallel batches (CONCURRENCY=5) for efficiency.
 */

const CONCURRENCY = 5;

async function mapWithConcurrency(items, fn, concurrency) {
  const executing = new Set();
  for (const item of items) {
    const p = fn(item).finally(() => executing.delete(p));
    executing.add(p);
    if (executing.size >= concurrency) await Promise.race(executing);
  }
  return Promise.allSettled([...executing]);
}

export async function runNightlyStageRecompute() {
  console.log("[Job] Starting nightly stage recompute...");
  let updatedCount = 0;
  let errorCount = 0;

  // Fixed: was fieldRepo.findFieldsByFarmer("") which returns 0 rows
  const allFields = await fieldRepo.findAllFields();

  if (allFields.length === 0) {
    console.warn("[Job] Stage recompute: no fields found in database. Job did nothing.");
    return;
  }

  console.log(`[Job] Recomputing ${allFields.length} fields (concurrency=${CONCURRENCY})...`);

  await mapWithConcurrency(
    allFields,
    async (field) => {
      try {
        const state = await layer2Service.getFieldCropState(field.id);
        updatedCount++;
        console.log(`[Job] Field ${field.id} (${field.name}): ${state.current_stage}`);
      } catch (err) {
        errorCount++;
        console.error(`[Job] Error recomputing field ${field.id}:`, err.message);
      }
    },
    CONCURRENCY,
  );

  console.log(`[Job] Done. Updated: ${updatedCount}, Errors: ${errorCount}, Total: ${allFields.length}`);
  if (updatedCount === 0 && allFields.length > 0) {
    console.error(`[Job] WARNING: Stage recompute processed ${allFields.length} fields but updated 0 — check crop calendar seeding.`);
  }
}

// If run directly: node src/jobs/recomputeStages.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runNightlyStageRecompute()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
