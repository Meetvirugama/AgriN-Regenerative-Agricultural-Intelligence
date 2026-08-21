from fastapi import APIRouter, HTTPException

from models.schemas import (
    RegenPlanRequest,
    RegenPlanResponse,
)


router = APIRouter(
    prefix="/regenerative",
    tags=["Layer 10 - Regenerative Agriculture"],
)


import json
from services.gemini_client import generate_text

@router.post(
    "/generate-plan",
    response_model=RegenPlanResponse,
)
async def generate_regen_plan(
    request: RegenPlanRequest,
):

    try:
        context = request.context
        soil = context.get("soil", {})
        crop_type = context.get("current_crop", context.get("crop_type", "unknown"))
        crop_history = context.get("crop_history", context.get("history", []))

        prompt = f"""
You are an expert agronomist specializing in regenerative agriculture.
Create a regenerative farming plan for a field with the following context:

Current Crop: {crop_type}
Soil Data: {json.dumps(soil)}
Crop History: {json.dumps(crop_history)}

Generate 2-3 specific, highly practical regenerative practices and 1-2 next-season crop rotation options.
Ensure recommendations match the soil properties.

Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO comments, and NO surrounding text:
{{
  "practices": [
    {{
      "id": "p1",
      "title": "Practice Name",
      "description": "How to do it",
      "effort_level": "low|medium|high",
      "reasoning": "Why it helps"
    }}
  ],
  "next_season_options": [
    {{
      "crop_type": "Crop Name",
      "variety": "Optional variety or null",
      "suitability_score": 85,
      "reasoning": "Why this rotation is good",
      "risk_factors": ["risk1"]
    }}
  ]
}}
"""

        data = generate_text(prompt, schema_class=RegenPlanResponse)
        
        return RegenPlanResponse(
            practices=data.get("practices", []),
            next_season_options=data.get("next_season_options", []),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Regenerative plan failed: {exc}",
        )
