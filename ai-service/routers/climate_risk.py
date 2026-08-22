from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status

from models.schemas import ClimateRiskRequest, ClimateRiskResponse

# IMPORTANT:
# Keep this import pointed at your existing Gemini service.
# It should expose generate_text(...) with JSON-schema enforcement.
from services.gemini_client import generate_text


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/climate-risk",
    tags=["Climate Risk"],
)


CLIMATE_RISK_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "severity": {
            "type": "string",
            "enum": [
                "low",
                "medium",
                "high",
                "critical",
                "unknown",
            ],
        },
        "riskType": {
            "type": "string",
            "minLength": 1,
        },
        "timeframe": {
            "type": "string",
            "minLength": 1,
        },
        "protectiveAction": {
            "type": "string",
            "minLength": 1,
        },
        "primaryRisks": {
            "type": "array",
            "items": {
                "type": "string",
                "minLength": 1,
            },
        },
    },
    "required": [
        "severity",
        "riskType",
        "timeframe",
        "protectiveAction",
        "primaryRisks",
    ],
}


def _clean_weather_summary(
    weather_summary: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Keep the prompt payload compact and deterministic.

    Do not manufacture missing weather values.
    """
    if not isinstance(weather_summary, dict):
        return {}

    return weather_summary


def _clean_history(
    historical_context: dict[str, Any] | None,
) -> dict[str, Any]:
    if not isinstance(historical_context, dict):
        return {}

    return historical_context


def _build_prompt(request: ClimateRiskRequest) -> str:
    weather = _clean_weather_summary(request.weather_summary)
    history = _clean_history(request.historical_context)

    sowing_date = request.sowing_date or "unknown"

    return f"""
You are the Climate Risk reasoning engine for AgriMesh.

AgriMesh is a field-specific agricultural intelligence system.
Climate risk must be interpreted using:

1. Field location
2. Crop
3. Crop growth stage
4. Sowing date when available
5. Actual weather forecast/context
6. Historical field/climate context when available

Your task is NOT to provide generic weather commentary.

Your task is to identify the most important climate-related agricultural
risk for this specific field and convert it into a practical protective
action.

FIELD CONTEXT
-------------
Field ID: {request.field_id}
Latitude: {request.lat}
Longitude: {request.lng}
Crop: {request.crop_type}
Growth stage: {request.crop_stage}
Sowing date: {sowing_date}

WEATHER FORECAST / SUMMARY
--------------------------
{json.dumps(weather, ensure_ascii=False, indent=2, default=str)}

HISTORICAL CONTEXT
------------------
{json.dumps(history, ensure_ascii=False, indent=2, default=str)}

DECISION RULES
--------------

- Use only evidence actually present in the supplied context.
- Do not invent weather measurements.
- Do not invent historical observations.
- Do not claim certainty when evidence is weak.
- If there is insufficient evidence for a meaningful climate risk,
  return severity="unknown".
- Prefer the most consequential current/future climate risk.
- Consider crop-stage sensitivity.
- A heat event during flowering may be more consequential than the
  same temperature during a less sensitive stage.
- Heavy rainfall should be interpreted in relation to crop stage and
  the available forecast.
- Drought risk should consider rainfall deficit and forecast conditions.
- Do not confuse ordinary weather with climate risk unless the
  agricultural impact is meaningful.
- Do not produce pesticide dosage or unsupported chemical treatment.
- Protective actions must be practical and agriculture-specific.
- Never fabricate precision.
- Keep primaryRisks concise and evidence-based.

SEVERITY
--------

Use:

low       = limited agricultural concern
medium    = meaningful risk requiring monitoring/planning
high      = substantial risk requiring timely protective action
critical  = severe/imminent risk requiring urgent intervention
unknown   = insufficient evidence for reliable assessment

RISK TYPE
---------

Use a concise agricultural risk category such as:

Heatwave
Drought
Extreme Rainfall
Waterlogging
Cold Stress
Frost
Wind Stress
Extreme Weather
Compound Heat and Drought
Compound Rainfall and Waterlogging
No Significant Climate Risk
Insufficient Data

TIMEFRAME
---------

State when the risk is expected.

Examples:

"Next 24 hours"
"2–3 days"
"3–5 days"
"Next 7 days"
"Next 2 weeks"

Do not invent an exact date unless supported by the forecast.

PROTECTIVE ACTION
-----------------

Give the most important practical action first.

The action must be directly related to the identified risk and crop
stage.

PRIMARY RISKS
-------------

Return 0–4 concise risk factors.

OUTPUT
------

Return ONLY the JSON object matching the supplied schema.
"""


def _normalise_response(raw: Any) -> ClimateRiskResponse:
    """
    Convert the AI result into the canonical Pydantic response.

    The model is already constrained by JSON schema, but this second
    validation layer protects the API boundary.
    """

    if isinstance(raw, ClimateRiskResponse):
        return raw

    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError("AI returned invalid JSON") from exc

    if not isinstance(raw, dict):
        raise ValueError("AI returned a non-object response")

    return ClimateRiskResponse.model_validate(raw)


@router.post(
    "/risk",
    response_model=ClimateRiskResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_climate_risk(
    request: ClimateRiskRequest,
) -> ClimateRiskResponse:
    """
    Generate a field-specific climate risk assessment.
    """

    try:
        prompt = _build_prompt(request)

        result = generate_text(
            prompt=prompt,
            schema_class=ClimateRiskResponse,
        )

        response = _normalise_response(result)

        logger.info(
            "Climate risk generated successfully field_id=%s risk=%s severity=%s",
            request.field_id,
            response.riskType,
            response.severity,
        )

        return response

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Climate risk generation failed field_id=%s",
            request.field_id,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Climate risk service temporarily unavailable",
        )
