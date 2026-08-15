const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface RegenPractice {
  id: string;
  title: string;
  description: string;
  effort_level: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface CropRanking {
  crop_type: string;
  variety: string | null;
  suitability_score: number; // 0-100
  reasoning: string;
  risk_factors: string[];
}

export interface RegenPlan {
  field_id: string;
  practices: RegenPractice[];
  next_season_options: CropRanking[];
  generated_at: string;
}

export const regenApi = {
  async getRegenPlan(fieldId: string): Promise<RegenPlan> {
    const res = await fetch(`${API_URL}/fields/${fieldId}/regen/planning`);
    if (!res.ok) throw new Error('Failed to fetch regen plan');
    return res.json();
  }
};
