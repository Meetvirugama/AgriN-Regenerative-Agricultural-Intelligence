from fastapi import APIRouter, HTTPException
import traceback
from datetime import datetime, timezone

from models.schemas import (
    ClimateRiskRequest,
    ClimateRiskResponse,
)

from services.gemini_client import generate_text

router = APIRouter(
    prefix="/climate-risk",
    tags=["Layer 08 - Climate Risk"],
)

@router.post(
    "/risk",
    response_model=ClimateRiskResponse,
)
async def assess_climate_risk(
    request: ClimateRiskRequest,
):
    try:
        prompt = f"""
You are an agricultural climate-risk analyst.

Assess climate risk for:

Crop: {request.crop_type}
Current growth stage: {request.crop_stage}
Location: latitude {request.lat}, longitude {request.lng}
Sowing date: {request.sowing_date}

CURRENT / FORECAST WEATHER
--------------------------
{request.weather_summary or "Not provided"}

HISTORICAL CONTEXT
------------------
{request.historical_context or "Not provided"}

Return practical agricultural advice based on the supplied weather forecast.

severity must be one of:
healthy, info, attention, urgent

riskType should be a short risk name such as:
Heatwave, Drought, Frost, Excess Rainfall, High Humidity, Favorable

Return:
- severity
- riskType
- timeframe (e.g. Next 3 days)
- protectiveAction
- primaryRisks (list of strings)
- generatedAt (leave empty or use current time)
"""

        result = generate_text(
            prompt,
            schema_class=ClimateRiskResponse
        )

        if hasattr(result, "model_dump"):
            data = result.model_dump()
        else:
            data = result

        data["generatedAt"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        return ClimateRiskResponse(**data)

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Climate risk assessment failed: {str(exc)}"
        )
