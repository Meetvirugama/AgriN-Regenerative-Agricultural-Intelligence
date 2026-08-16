from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import asyncio
import time

router = APIRouter()

class GlobalInsight(BaseModel):
    id: str
    insightType: str
    sourceRegion: str
    comparableClimateZone: str
    recommendation: str
    confidenceScore: float
    adoptionRate: int

class CrossBorderResponse(BaseModel):
    fieldId: str
    insights: List[GlobalInsight]

@router.get("/insights/{field_id}", response_model=CrossBorderResponse)
async def get_global_insights(field_id: str):
    try:
        # Simulate ML prediction delay mapping climate zones
        await asyncio.sleep(1.0)
        
        mock_insights = [
            GlobalInsight(
                id=f"cbi-{int(time.time() * 1000)}-1",
                insightType='practice',
                sourceRegion='Kenya (Rift Valley)',
                comparableClimateZone='Semi-Arid Tropics',
                recommendation='Switch to a 3-week cover crop rotation between wheat cycles to retain 15% more soil moisture during peak dry spells.',
                confidenceScore=0.89,
                adoptionRate=64
            ),
            GlobalInsight(
                id=f"cbi-{int(time.time() * 1000)}-2",
                insightType='risk_model',
                sourceRegion='Brazil (Mato Grosso)',
                comparableClimateZone='Tropical Savanna',
                recommendation='Early-warning models suggest current humidity patterns precede severe rust outbreaks within 14 days. Pre-emptive fungicide application recommended.',
                confidenceScore=0.92,
                adoptionRate=81
            )
        ]

        return CrossBorderResponse(
            fieldId=field_id,
            insights=mock_insights
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
