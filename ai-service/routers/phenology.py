from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from models.schemas import (
    PhenologyRequest,
    PhenologyResponse,
)


router = APIRouter(
    prefix="/phenology",
    tags=["Layer 02 - Crop Growth Stage"],
)


BASE_TEMPS = {
    "wheat": 4.0,
    "rice": 10.0,
    "maize": 10.0,
    "cotton": 15.5,
    "soybean": 10.0,
    "sugarcane": 10.0,
}


STAGE_DESCRIPTIONS = {

    "wheat": {
        "germination":
            "Maintain adequate soil moisture "
            "without prolonged waterlogging.",

        "vegetative":
            "Monitor nitrogen availability "
            "and weed pressure.",

        "flowering":
            "Avoid water stress during this "
            "sensitive growth period.",

        "maturity":
            "Monitor crop maturity and "
            "prepare for harvest.",
    },

    "rice": {
        "germination":
            "Maintain appropriate water conditions "
            "and avoid prolonged stress.",

        "vegetative":
            "Monitor nitrogen status and "
            "stem-borer pressure.",

        "flowering":
            "Maintain suitable water conditions "
            "and monitor disease pressure.",

        "maturity":
            "Gradually manage water before harvest.",
    },

    "maize": {
        "germination":
            "Protect seedlings from early "
            "pest and bird damage.",

        "vegetative":
            "Monitor nitrogen uptake and "
            "weed competition.",

        "flowering":
            "Silking is highly sensitive to "
            "heat and water stress.",

        "maturity":
            "Monitor grain maturity and "
            "harvest readiness.",
    },
}


def parse_datetime(value: str) -> datetime:

    parsed = datetime.fromisoformat(
        value.replace("Z", "+00:00")
    )

    if parsed.tzinfo is None:

        parsed = parsed.replace(
            tzinfo=timezone.utc
        )

    return parsed


def get_stage_description(
    stage: str,
    crop_type: str,
) -> str:

    crop = STAGE_DESCRIPTIONS.get(
        crop_type.lower(),
        {},
    )

    return crop.get(
        stage.lower(),
        "Monitor crop development regularly.",
    )


@router.post(
    "/gdd",
    response_model=PhenologyResponse,
)
async def calculate_phenology(
    request: PhenologyRequest,
):

    try:

        sowing = parse_datetime(
            request.sowing_date
        )

        now = datetime.now(timezone.utc)

        diff_days = max(
            0,
            (now - sowing).days,
        )

        max_temps = request.temp_max_c
        min_temps = request.temp_min_c

        real_temperature_available = (
            max_temps is not None
            and min_temps is not None
            and len(max_temps) == len(min_temps)
            and len(max_temps) > 0
        )

        if real_temperature_available:

            crop = request.calendar.crop_type.lower()

            base_temp = BASE_TEMPS.get(
                crop,
                10.0,
            )

            gdd = 0.0

            for t_max, t_min in zip(
                max_temps,
                min_temps,
            ):

                if t_max < t_min:
                    raise ValueError(
                        "Temperature history contains "
                        "temp_max below temp_min."
                    )

                mean_temp = (
                    t_max + t_min
                ) / 2.0

                gdd += max(
                    0.0,
                    mean_temp - base_temp,
                )

            accumulated_gdd = int(
                round(gdd)
            )

            method = "real_temperature"

        else:

            accumulated_gdd = diff_days * 15
            method = "estimated_15_per_day"

        stages = sorted(
            request.calendar.stages,
            key=lambda stage: stage.gdd_threshold,
        )

        if not stages:

            current_stage = "vegetative"

        else:

            current_stage = stages[0].stage

            for stage in stages:

                if accumulated_gdd >= stage.gdd_threshold:
                    current_stage = stage.stage
                else:
                    break

        description = get_stage_description(
            current_stage,
            request.calendar.crop_type,
        )

        return PhenologyResponse(
            accumulated_gdd=accumulated_gdd,
            current_stage=current_stage,
            stage_description=description,
            gdd_method=method,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Phenology calculation failed: {exc}",
        )
