import { layer1Service } from "../field/field.service.js";
import { layer4Service } from "../soil/soil.service.js";
import { regenAI } from "./regen.ai.js";
import { queryOne, execute } from "../../db/connection.js";

/** Cache TTL: 24 hours — plans older than this are regenerated */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class Layer10Service {
  /**
   * Orchestrates the context gathering and triggers the Regen AI.
   * Plans are persisted in Postgres (regen_plans table, migration 019).
   * A 24h TTL is enforced: stale plans trigger fresh generation.
   */
  async getRegenPlan(fieldId) {
    // Check DB for a recent plan (< 24h old)
    const existing = await queryOne(
      `SELECT field_id, crop_type, practices, next_season_options,
              generated_at::text
       FROM regen_plans
       WHERE field_id = $1
         AND generated_at > NOW() - INTERVAL '24 hours'`,
      [fieldId],
    ).catch(() => null); // table may not exist yet — degrade gracefully

    if (existing) {
      return {
        field_id: existing.field_id,
        crop_type: existing.crop_type,
        practices: existing.practices ?? [],
        next_season_options: existing.next_season_options ?? [],
        generated_at: existing.generated_at,
        cached: true,
      };
    }

    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error("Field not found");

    // Fixed: added missing `await`
    const latestSoil = await layer4Service.getActiveSoilProfile(fieldId).catch(() => null);

    const context = {
      crop_type: field.crop_type,
      soil: latestSoil,
      history: [], // Field history (Layer 12) — not yet implemented
    };

    const aiResult = await regenAI.generatePlan(context);

    const plan = {
      field_id: fieldId,
      crop_type: field.crop_type,
      practices: aiResult.practices ?? [],
      next_season_options: aiResult.next_season_options ?? [],
      carbon_credits_est: aiResult.carbon_credits_estimate ?? null,
      summary: aiResult.summary ?? null,
      generated_at: new Date().toISOString(),
      cached: false,
    };

    // Persist to Postgres (upsert — one plan per field)
    await execute(
      `INSERT INTO regen_plans
         (field_id, crop_type, practices, next_season_options)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (field_id) DO UPDATE SET
         crop_type = EXCLUDED.crop_type,
         practices = EXCLUDED.practices,
         next_season_options = EXCLUDED.next_season_options,
         generated_at = NOW()`,
      [
        fieldId,
        plan.crop_type,
        JSON.stringify(plan.practices),
        JSON.stringify(plan.next_season_options),
      ],
    ).catch((err) => {
      // regen_plans table may not be migrated yet — log but don't fail
      console.warn("[Regen] Could not persist plan to DB:", err.message);
    });

    return plan;
  }
}

export const layer10Service = new Layer10Service();
