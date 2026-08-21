from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from models.schemas import (
    WeatherRuleRequest,
    WeatherEventFlag,
)


router = APIRouter(
    prefix="/weather",
    tags=["Layer 03 - Weather"],
)


def utc_now_iso() -> str:

    return (
        datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


@router.post(
    "/evaluate",
    response_model=list[WeatherEventFlag],
)
async def evaluate_rules(
    request: WeatherRuleRequest,
):

    try:

        flags = []

        generated_at = utc_now_iso()

        forecasts = request.forecasts
        config = request.config
        field_id = request.field_id

        # --------------------------------------------------
        # Heavy rain
        # --------------------------------------------------

        rain_days = [
            f for f in forecasts
            if f.rainfall_mm is not None and f.rainfall_mm >= config.rain_threshold_mm
        ]

        if rain_days:

            severity = (
                "high"
                if any(
                    f.rainfall_mm > 40
                    for f in rain_days
                )
                else "medium"
            )

            flags.append(
                WeatherEventFlag(
                    id=(
                        f"flag_{field_id}_rain_"
                        f"{rain_days[0].date}"
                    ),
                    field_id=field_id,
                    event_type="rain_expected",
                    start_date=rain_days[0].date,
                    end_date=rain_days[-1].date,
                    severity=severity,
                    message=(
                        "Heavy rainfall expected."
                        if severity == "high"
                        else
                        "Significant rainfall expected."
                    ),
                    generated_at=generated_at,
                )
            )

        # --------------------------------------------------
        # Heat
        # --------------------------------------------------

        heat_days = [
            f for f in forecasts
            if f.temp_max is not None and f.temp_max >= config.heat_threshold_c
        ]

        if heat_days:

            severity = (
                "high"
                if any(
                    f.temp_max > 40
                    for f in heat_days
                )
                else "medium"
            )

            flags.append(
                WeatherEventFlag(
                    id=(
                        f"flag_{field_id}_heat_"
                        f"{heat_days[0].date}"
                    ),
                    field_id=field_id,
                    event_type="heat_event",
                    start_date=heat_days[0].date,
                    end_date=heat_days[-1].date,
                    severity=severity,
                    message=(
                        "Extreme heat expected. "
                        "Crop stress risk is elevated."
                    ),
                    generated_at=generated_at,
                )
            )

        # --------------------------------------------------
        # Humidity
        # --------------------------------------------------

        humid_days = [
            f for f in forecasts
            if f.humidity_pct is not None and f.humidity_pct >= config.humidity_threshold_pct
        ]

        if humid_days:

            flags.append(
                WeatherEventFlag(
                    id=(
                        f"flag_{field_id}_humidity_"
                        f"{humid_days[0].date}"
                    ),
                    field_id=field_id,
                    event_type="humidity_spike",
                    start_date=humid_days[0].date,
                    end_date=humid_days[-1].date,
                    severity="medium",
                    message=(
                        "High humidity may increase "
                        "disease pressure."
                    ),
                    generated_at=generated_at,
                )
            )

        # --------------------------------------------------
        # Frost
        # --------------------------------------------------

        frost_days = [
            f for f in forecasts
            if f.temp_min is not None and f.temp_min <= config.frost_threshold_c
        ]

        if frost_days:

            severity = (
                "high"
                if any(
                    f.temp_min <= 0
                    for f in frost_days
                )
                else "medium"
            )

            flags.append(
                WeatherEventFlag(
                    id=(
                        f"flag_{field_id}_frost_"
                        f"{frost_days[0].date}"
                    ),
                    field_id=field_id,
                    event_type="frost_warning",
                    start_date=frost_days[0].date,
                    end_date=frost_days[-1].date,
                    severity=severity,
                    message=(
                        "Frost conditions may damage "
                        "sensitive crops."
                    ),
                    generated_at=generated_at,
                )
            )

        return flags

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Weather rule evaluation failed: {exc}",
        )
