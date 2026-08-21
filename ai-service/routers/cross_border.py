from fastapi import APIRouter, HTTPException
import time

from models.schemas import (
    CrossBorderResponse,
    GlobalInsight,
)


router = APIRouter(
    prefix="/cross-border",
    tags=["Layer 14 - Cross Border"],
)


import json
import time
from services.gemini_client import generate_text

@router.get(
    "/insights/{field_id}",
    response_model=CrossBorderResponse,
)
async def get_global_insights(
    field_id: str,
):
    try:
        # We need the crop type and climate zone for this field. 
        # Since this GET endpoint doesn't receive the field context directly, 
        # we will write a generic prompt asking the AI to assume a typical 
        # context based on the region, or we can prompt the AI to generate a 
        # realistic agricultural insight for a random developing region.
        # But wait, we can just ask the AI to generate an insight for a generic "Semi-Arid" climate 
        # since we don't have the full field data here (Node.js doesn't pass it yet).
        
        prompt = f"""
You are an expert agronomist mapping cross-border agricultural intelligence.
Generate 1 highly specific, validated regenerative agriculture practice from a comparable climate zone globally that would be useful for a farmer in a Semi-Arid region (e.g., Gujarat, India).

Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO comments, and NO surrounding text:
{{
  "insights": [
    {{
      "insightType": "practice|technology|market",
      "sourceRegion": "Where this practice is successful (e.g. 'Sahel, Africa')",
      "comparableClimateZone": "Semi-Arid",
      "recommendation": "Detailed description of the practice",
      "confidenceScore": 0.85,
      "adoptionRate": 15
    }}
  ]
}}
"""

        data = generate_text(prompt, schema_class=CrossBorderResponse)
        
        insights_data = data.get("insights", [])
        insights = []
        for i, item in enumerate(insights_data):
            insights.append(GlobalInsight(
                id=f"cbi-{int(time.time() * 1000)}-{i}",
                insightType=item.get("insightType", "practice"),
                sourceRegion=item.get("sourceRegion", "Global"),
                comparableClimateZone=item.get("comparableClimateZone", "Unknown"),
                recommendation=item.get("recommendation", ""),
                confidenceScore=float(item.get("confidenceScore", 0.0)),
                adoptionRate=int(item.get("adoptionRate", 0))
            ))

        return CrossBorderResponse(
            fieldId=field_id,
            insights=insights,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cross-border intelligence failed: {exc}",
        )
