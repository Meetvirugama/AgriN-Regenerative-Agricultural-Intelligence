import { PythonClient } from "../../services/pythonClient.js";

export class RegenAI {
  /**
   * Delegates AI call for regenerative practices and crop planning to Python service.
   */
  async generatePlan(context) {
    console.log(
      "[RegenAI] Delegating plan generation to Python service for context:",
      context.crop_type,
    );
    const result = await PythonClient.generateRegenPlan(context);
    return {
      practices: result.practices,
      next_season_options: result.next_season_options,
    };
  }
}

export const regenAI = new RegenAI();
