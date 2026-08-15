import { db, RegenPlan } from '../models/Database';
import { layer1Service } from './Layer1Service';
import { layer4Service } from './Layer4Service';
import { regenAI } from './regen/RegenAI';

export class Layer10Service {
  /**
   * Orchestrates the context gathering and triggers the Regen AI.
   */
  public async getRegenPlan(fieldId: string): Promise<RegenPlan> {
    // Return cached plan if it exists
    const existing = db.regenPlans.get(fieldId);
    if (existing) {
      return existing;
    }

    const field = await layer1Service.getField(fieldId);
    if (!field) throw new Error('Field not found');

    const latestSoil = layer4Service.getActiveSoilProfile(fieldId);

    // Mock Field History (Layer 12 substitute)
    const mockHistory = [
      { season: 'Kharif 2025', crop: 'Rice', yield: 'Average' },
      { season: 'Rabi 2024', crop: 'Wheat', yield: 'High' }
    ];

    const context = {
      crop_type: field.crop_type,
      soil: latestSoil,
      history: mockHistory
    };

    const aiResult = await regenAI.generatePlan(context);

    const plan: RegenPlan = {
      field_id: fieldId,
      practices: aiResult.practices,
      next_season_options: aiResult.next_season_options,
      generated_at: new Date().toISOString()
    };

    db.regenPlans.set(fieldId, plan);
    return plan;
  }
}

export const layer10Service = new Layer10Service();
