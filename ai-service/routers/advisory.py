import uuid
from fastapi import APIRouter, HTTPException
import traceback

from models.schemas import (
    AdvisoryRequest,
    AdvisoryResponse,
)

from services.gemini_client import generate_text

router = APIRouter(
    prefix="/advisory",
    tags=["Layer 09 - AI Advisory"],
)

@router.post(
    "/generate",
    response_model=AdvisoryResponse,
)
async def generate_advisory(
    request: AdvisoryRequest,
):
    try:
        field_context = request.field_context or {}

        prompt = f"""
You are AgriMesh's agricultural decision-support engine.

Your job is NOT to provide generic agricultural information.

You must reason ONLY from the supplied field context and
clearly indicate uncertainty when the available evidence
is insufficient.

FIELD
-----
Crop: {request.crop_type}
Growth stage: {request.crop_stage}

SATELLITE DATA
--------------
{request.satellite_summary}

WEATHER
-------
{request.weather_summary}

SOIL
----
{request.soil_summary}

FIELD CONTEXT
-------------
{field_context}

LANGUAGE
--------
{request.farmer_language}

REASONING RULES
---------------

1. Identify what is happening (what_text).
2. Explain why using supplied evidence (why_text).
3. State severity/urgency as one of: Low, Medium, High, Urgent.
4. Give the most useful practical action (action_text).
5. Give a concrete timeframe (action_deadline).
6. State what the farmer should monitor next (monitor_text).
7. Include source_layers (e.g. Weather, Soil, Satellite).
8. Do not invent measurements, weather values, or soil values.
9. If evidence is insufficient, explicitly say so.
10. Prefer conservative recommendations when uncertainty is high.
11. Respond naturally in the requested farmer language.

Return the required structured JSON response matching the schema.
"""

        result = generate_text(
            prompt,
            schema_class=AdvisoryResponse,
        )

        if hasattr(result, "model_dump"):
            data = result.model_dump()
        else:
            data = result
            
        if not data.get("id"):
            data["id"] = f"adv-{uuid.uuid4()}"
            
        return AdvisoryResponse(**data)

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Advisory generation failed: {str(exc)}",
        )
