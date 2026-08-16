from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Any
import asyncio

router = APIRouter()

class RegenPlanRequest(BaseModel):
    context: Any

class RegenPlanResponse(BaseModel):
    practices: List[Any]
    next_season_options: List[Any]

@router.post("/generate-plan", response_model=RegenPlanResponse)
async def generate_regen_plan(request: RegenPlanRequest):
    try:
        context = request.context
        
        # Simulate AI delay (in a real scenario, this would call Gemini API)
        await asyncio.sleep(1.5)

        practices = [
            {
                'id': 'p1',
                'title': 'Plant Legume Cover Crop',
                'description': 'Sow cowpea or clover immediately after the current harvest.',
                'effort_level': 'medium',
                'reasoning': 'Your field history shows 3 continuous seasons of cereals. A legume cover crop will break the pest cycle and naturally fix nitrogen, saving fertilizer costs next season.'
            },
            {
                'id': 'p2',
                'title': 'Reduced Tillage',
                'description': 'Minimize soil disturbance during the next field preparation.',
                'effort_level': 'low',
                'reasoning': 'Your soil profile indicates moderate organic matter. Reducing tillage will help retain moisture during the upcoming dry season and build soil structure.'
            }
        ]

        next_season_options = [
            {
                'crop_type': 'Soybean',
                'variety': 'Drought-Tolerant DS-21',
                'suitability_score': 92,
                'reasoning': 'Excellent rotation match after Wheat. Rebuilds soil nitrogen and matches the forecasted drier-than-average season.',
                'risk_factors': ['Requires timely early-season weeding']
            },
            {
                'crop_type': 'Cotton',
                'variety': 'BT Cotton',
                'suitability_score': 75,
                'reasoning': 'High cash value, but requires more intense pest management. Soil pH (6.8) is optimal.',
                'risk_factors': ['High water requirement during flowering', 'Pest pressure high in your region']
            },
            {
                'crop_type': 'Rice',
                'variety': 'Basmati',
                'suitability_score': 45,
                'reasoning': 'Not recommended. Your soil moisture retention is currently low and the seasonal forecast predicts a 20% rainfall deficit.',
                'risk_factors': ['Severe water stress risk', 'High pumping costs']
            }
        ]

        return RegenPlanResponse(practices=practices, next_season_options=next_season_options)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
