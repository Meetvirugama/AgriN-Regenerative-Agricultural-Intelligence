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


def get_previous_tile(history, current_date):
    if not history:
        return None

    sorted_history = sorted(
        [h for h in history if h.get("captureDate") != current_date],
        key=lambda item: item.get("captureDate", ""),
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

        previous = get_previous_tile(
            request.history,
            current.get("captureDate")
        )

        if previous is None:

            return ProcessSatelliteResponse(
                latestTile=current,
                trend=None,
                activeAnomalies=[],
            )

        current_ndvi = float(
            current.get("ndviMean", 0)
        )

        previous_ndvi = float(
            previous.get("ndviMean", 0)
        )

        current_moisture = float(
            current.get("moistureProxy", 0)
        )

        previous_moisture = float(
            previous.get("moistureProxy", 0)
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
            "date": current.get("captureDate"),
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

        current_regions = current.get(
            "ndviBySubregion",
            [],
        )

        previous_regions = previous.get(
            "ndviBySubregion",
            [],
        )

        previous_map = {
            region.get("subregionId"): region
            for region in previous_regions
        }

        for region in current_regions:

            subregion_id = region.get(
                "subregionId"
            )

            previous_region = previous_map.get(
                subregion_id
            )

            if previous_region is None:
                continue

            previous_ndvi = float(
                previous_region.get("ndvi", 0)
            )

            current_ndvi = float(
                region.get("ndvi", 0)
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
                    f"{current.get('captureDate')}"
                ),

                "fieldId": request.field_id,

                "subregionGeometry":
                    region.get("geometry"),

                "subregionLabel":
                    region.get("label"),

                "detectedDate":
                    current.get("captureDate"),

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
