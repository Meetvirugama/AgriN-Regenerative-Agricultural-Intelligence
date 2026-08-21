from fastapi import APIRouter, HTTPException

from models.schemas import (
    RegenPlanRequest,
    RegenPlanResponse,
)


router = APIRouter(
    prefix="/regenerative",
    tags=["Layer 10 - Regenerative Agriculture"],
)


@router.post(
    "/generate-plan",
    response_model=RegenPlanResponse,
)
async def generate_regen_plan(
    request: RegenPlanRequest,
):

    try:

        context = request.context

        soil = context.get(
            "soil",
            {},
        )

        # Node's regen.service.js builds context as { crop_type, soil, history }.
        # This handler was reading "crop_history" and "current_crop", which
        # Node never sends — so the cover-crop recommendation and the
        # next-season-option suggestion were always skipped, regardless of
        # the field's actual crop history. Accept both the current Node key
        # names and the originally-intended ones so either caller works.
        crop_history = context.get(
            "crop_history",
            context.get("history", []),
        )

        practices = []

        # --------------------------------------------------
        # Cover crop recommendation
        # --------------------------------------------------

        if len(crop_history) >= 2:

            practices.append({
                "id": "p1",
                "title": "Consider a legume cover crop",
                "description": (
                    "Consider a legume cover crop "
                    "between production seasons."
                ),
                "effort_level": "medium",
                "reasoning": (
                    "A diversified rotation may improve "
                    "soil resilience and reduce continuous "
                    "cropping pressure."
                ),
            })

        # --------------------------------------------------
        # Reduced tillage
        # --------------------------------------------------

        practices.append({
            "id": "p2",
            "title": "Reduce unnecessary soil disturbance",
            "description": (
                "Minimize tillage where agronomically "
                "appropriate."
            ),
            "effort_level": "low",
            "reasoning": (
                "Reduced disturbance can help maintain "
                "soil structure and moisture."
            ),
        })

        # --------------------------------------------------
        # Next-season options
        # --------------------------------------------------

        options = []

        current_crop = context.get(
            "current_crop",
            context.get("crop_type"),
        )

        if current_crop:

            options.append({
                "crop_type": "Soybean",
                "variety": None,
                "suitability_score": None,
                "reasoning": (
                    "Potential rotation option. "
                    "Requires local climate and market "
                    "validation before planting."
                ),
                "risk_factors": [
                    "Local suitability must be validated",
                    "Market conditions must be checked",
                ],
            })

        return RegenPlanResponse(
            practices=practices,
            next_season_options=options,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Regenerative plan failed: {exc}",
        )
