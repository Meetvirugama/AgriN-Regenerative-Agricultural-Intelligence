from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from models.schemas import (
    ProcessSatelliteRequest,
    ProcessSatelliteResponse,
)


router = APIRouter(
    prefix="/satellite",
    tags=["Layer 05 - Satellite"],
)


def utc_now_iso():

    return (
        datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _get(d, *keys, default=None):
    """
    Look up the first present key from `keys` in dict `d`.

    The Node gateway (satellite.service.js `_formatTile`) sends tiles using
    the DB's snake_case column aliases (observation_date, ndvi_mean,
    ndmi_mean, ...), not the camelCase names used internally by the raw
    provider objects (captureDate, ndviMean, moistureProxy, ...). This
    router previously only looked up the camelCase names, so `.get(...)`
    always missed and silently fell back to `None`/`0` for every tile —
    trend and anomaly detection ran, but always against zeroed-out data,
    with no error raised. Checking both naming conventions here fixes that
    without requiring the two services to agree on a single casing.
    """
    for key in keys:
        if key in d and d[key] is not None:
            return d[key]
    return default


def get_previous_tile(history, current_date):
    if not history:
        return None

    sorted_history = sorted(
        [h for h in history if _get(h, "observation_date", "captureDate") != current_date],
        key=lambda item: _get(item, "observation_date", "captureDate", default=""),
        reverse=True,
    )

    return sorted_history[0] if sorted_history else None


@router.post(
    "/process",
    response_model=ProcessSatelliteResponse,
)
async def process_satellite_data(
    request: ProcessSatelliteRequest,
):

    try:

        current = request.current_tile

        current_date = _get(current, "observation_date", "captureDate")

        previous = get_previous_tile(
            request.history,
            current_date
        )

        if previous is None:

            return ProcessSatelliteResponse(
                latestTile=current,
                trend=None,
                activeAnomalies=[],
            )

        current_ndvi = float(
            _get(current, "ndvi_mean", "ndviMean", default=0)
        )

        previous_ndvi = float(
            _get(previous, "ndvi_mean", "ndviMean", default=0)
        )

        current_moisture = float(
            _get(current, "ndmi_mean", "moisture_proxy", "moistureProxy", default=0)
        )

        previous_moisture = float(
            _get(previous, "ndmi_mean", "moisture_proxy", "moistureProxy", default=0)
        )

        ndvi_diff = (
            current_ndvi - previous_ndvi
        )

        moisture_diff = (
            current_moisture - previous_moisture
        )

        if ndvi_diff > 0.05:
            ndvi_direction = "improving"

        elif ndvi_diff < -0.05:
            ndvi_direction = "declining"

        else:
            ndvi_direction = "stable"

        if moisture_diff > 0.05:
            moisture_direction = "improving"

        elif moisture_diff < -0.05:
            moisture_direction = "declining"

        else:
            moisture_direction = "stable"

        if ndvi_direction == "improving":

            summary = "Vegetation is improving."

        elif ndvi_direction == "declining":

            summary = (
                "Vegetation decline detected "
                "compared with the previous observation."
            )

        else:

            summary = "Vegetation is relatively stable."

        trend = {
            "fieldId": request.field_id,
            "date": current_date,
            "ndviTrendDirection": ndvi_direction,
            "moistureTrend": moisture_direction,
            "ndviValue": current_ndvi,
            "moistureValue": current_moisture,
            "summaryText": summary,
            "computedAt": utc_now_iso(),
        }

        # --------------------------------------------------
        # Anomaly detection
        # --------------------------------------------------

        anomalies = []

        current_regions = _get(
            current,
            "ndvi_by_subregion", "ndviBySubregion",
            default=[],
        )

        previous_regions = _get(
            previous,
            "ndvi_by_subregion", "ndviBySubregion",
            default=[],
        )

        previous_map = {
            _get(region, "subregion_id", "subregionId"): region
            for region in previous_regions
        }

        for region in current_regions:

            subregion_id = _get(
                region, "subregion_id", "subregionId"
            )

            previous_region = previous_map.get(
                subregion_id
            )

            if previous_region is None:
                continue

            previous_ndvi = float(
                _get(previous_region, "ndvi", default=0)
            )

            current_ndvi = float(
                _get(region, "ndvi", default=0)
            )

            if previous_ndvi <= 0:
                continue

            drop_pct = (
                previous_ndvi - current_ndvi
            ) / previous_ndvi

            if drop_pct <= 0.15:
                continue

            severity = (
                "high"
                if drop_pct > 0.25
                else "moderate"
            )

            anomalies.append({
                "id": (
                    f"anomaly-"
                    f"{request.field_id}-"
                    f"{subregion_id}-"
                    f"{current_date}"
                ),

                "fieldId": request.field_id,

                "subregionGeometry":
                    region.get("geometry"),

                "subregionLabel":
                    region.get("label"),

                "detectedDate":
                    current_date,

                "anomalyType":
                    "vegetation_decline",

                "severity":
                    severity,

                "dropPercentage":
                    round(drop_pct * 100, 2),

                "stillActive": True,

                "resolvedDate": None,
            })

        return ProcessSatelliteResponse(
            latestTile=current,
            trend=trend,
            activeAnomalies=anomalies,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Satellite processing failed: {exc}",
        )
