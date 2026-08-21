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


@router.get(
    "/insights/{field_id}",
    response_model=CrossBorderResponse,
)
async def get_global_insights(
    field_id: str,
):

    try:

        insights = [
            GlobalInsight(
                id=f"cbi-{int(time.time() * 1000)}-1",
                insightType="practice",
                sourceRegion="Comparable climate region",
                comparableClimateZone="Semi-Arid",
                recommendation=(
                    "No validated cross-border practice "
                    "is currently available for this field."
                ),
                confidenceScore=0.0,
                adoptionRate=0,
            )
        ]

        return CrossBorderResponse(
            fieldId=field_id,
            insights=insights,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Cross-border intelligence failed: {exc}",
        )
