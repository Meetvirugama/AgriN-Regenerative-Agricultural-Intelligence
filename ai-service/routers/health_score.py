from fastapi import APIRouter, HTTPException

from models.schemas import (
    HealthScoreRequest,
    HealthScoreResponse,
    DimensionResult,
)

router = APIRouter(
    prefix="/health-score",
    tags=["Layer 06 - Health Score"],
)


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def compute_vegetation_trend(
    latest_trend,
    active_anomalies,
) -> DimensionResult:

    basis = []

    if active_anomalies:

        high_anomaly = any(
            a.get("severity") == "high"
            for a in active_anomalies
        )

        return DimensionResult(
            value="Decline detected",
            severity="red" if high_anomaly else "amber",
            basis=[
                f"Satellite anomaly detected in "
                f"{len(active_anomalies)} sub-region(s)"
            ],
        )

    if not latest_trend:

        return DimensionResult(
            value="Unknown",
            severity="amber",
            basis=[
                "No recent satellite trend data available"
            ],
        )

    direction = latest_trend.get(
        "ndviTrendDirection",
        "stable",
    )

    if direction == "improving":

        return DimensionResult(
            value="Improving",
            severity="green",
            basis=[
                "Field-wide NDVI is increasing compared "
                "with the previous observation"
            ],
        )

    if direction == "declining":

        return DimensionResult(
            value="Declining",
            severity="amber",
            basis=[
                "Field-wide NDVI is declining",
                "Continue monitoring affected areas",
            ],
        )

    return DimensionResult(
        value="Stable",
        severity="green",
        basis=[
            "Vegetation index is stable"
        ],
    )


def compute_water_condition(
    weather,
    soil,
    tile,
    stage,
) -> DimensionResult:

    basis = []

    stage_name = stage.get("stage", "unknown")
    water_need = stage.get("waterNeed", "unknown")

    water_capacity = soil.get(
        "waterHoldingCapacity",
        "unknown",
    )

    basis.append(
        f"Crop stage: {stage_name}"
    )

    basis.append(
        f"Stage water requirement: {water_need}"
    )

    basis.append(
        f"Soil water-holding capacity: {water_capacity}"
    )

    recent_rain = safe_float(
        weather.get("recentRainfallMm")
    )

    forecast_rain = safe_float(
        weather.get("forecastRainfallMm")
    )

    moisture_proxy = None

    if tile:
        moisture_proxy = safe_float(
            tile.get("moistureProxy"),
            default=None,
        )

    if (
        recent_rain < 5
        and forecast_rain == 0
        and water_capacity == "low"
    ):

        basis.append(
            "Low rainfall combined with low-retention soil"
        )

        return DimensionResult(
            value="Drying",
            severity="amber",
            basis=basis,
        )

    if (
        moisture_proxy is not None
        and moisture_proxy < 0.3
    ):

        basis.append(
            "Satellite moisture proxy is critically low"
        )

        return DimensionResult(
            value="Stressed",
            severity="red",
            basis=basis,
        )

    return DimensionResult(
        value="Adequate",
        severity="green",
        basis=basis,
    )


def compute_soil_condition(soil) -> DimensionResult:

    nitrogen = soil.get(
        "nitrogenLevel",
        "unknown",
    )

    basis = [
        f"Texture: {soil.get('texture', 'unknown')}",
        f"Organic matter: "
        f"{soil.get('organicMatterPct', 'unknown')}",
        f"Nitrogen: {nitrogen}",
        f"Phosphorus: "
        f"{soil.get('phosphorusLevel', 'unknown')}",
        f"Potassium: "
        f"{soil.get('potassiumLevel', 'unknown')}",
    ]

    if nitrogen == "low":

        return DimensionResult(
            value="Needs attention",
            severity="amber",
            basis=basis,
        )

    return DimensionResult(
        value="Moderate",
        severity="green",
        basis=basis,
    )


def compute_weather_risk(
    weather,
    stage,
) -> DimensionResult:

    flags = weather.get(
        "activeFlags",
        [],
    )

    basis = []

    if flags:

        basis.append(
            "Active weather flags: "
            + ", ".join(map(str, flags))
        )

        severity = "amber"
        value = "Elevated Risk"

    else:

        severity = "green"
        value = "Low Risk"

        basis.append(
            "No severe weather event currently flagged"
        )

    max_temp = safe_float(
        weather.get("forecastHighTemp")
    )

    stage_name = str(
        stage.get("stage", "")
    ).lower()

    if (
        max_temp > 33
        and stage_name == "flowering"
    ):

        severity = "red"
        value = "High Risk"

        basis.append(
            "High temperature during flowering "
            "can increase crop stress"
        )

    return DimensionResult(
        value=value,
        severity=severity,
        basis=basis,
    )


def compute_disease_risk(
    weather,
    anomalies,
) -> DimensionResult:

    basis = []

    humidity = safe_float(
        weather.get("humidityAvg")
    )

    rainfall = safe_float(
        weather.get("recentRainfallMm")
    )

    if humidity > 80 and rainfall > 10:

        severity = "amber"
        value = "Elevated Risk"

        basis.append(
            "High humidity and recent rainfall "
            "may favor fungal disease"
        )

    else:

        severity = "green"
        value = "Low Risk"

        basis.append(
            "Current weather does not strongly "
            "indicate elevated disease pressure"
        )

    vegetation_decline = any(
        a.get("anomalyType") == "vegetation_decline"
        for a in anomalies
    )

    if vegetation_decline:

        basis.append(
            "Vegetation decline detected in at least "
            "one field sub-region"
        )

    return DimensionResult(
        value=value,
        severity=severity,
        basis=basis,
    )


def compute_climate_stress(
    weather,
    anomalies,
) -> DimensionResult:

    stress = weather.get(
        "climateStress"
    )

    if stress == "high":

        return DimensionResult(
            value="High",
            severity="red",
            basis=[
                "Weather context indicates elevated "
                "medium-term climate stress"
            ],
        )

    if stress == "medium":

        return DimensionResult(
            value="Elevated",
            severity="amber",
            basis=[
                "Weather context indicates moderate "
                "climate stress"
            ],
        )

    return DimensionResult(
        value="Normal",
        severity="green",
        basis=[
            "No significant climate stress signal "
            "was provided"
        ],
    )


def compute_crop_health(
    dimensions,
) -> DimensionResult:

    red_count = sum(
        d.severity == "red"
        for d in dimensions
    )

    amber_count = sum(
        d.severity == "amber"
        for d in dimensions
    )

    if red_count > 0:

        return DimensionResult(
            value="Concern",
            severity="red",
            basis=[
                f"{red_count} critical stress "
                f"factor(s) identified"
            ],
        )

    if amber_count > 0:

        return DimensionResult(
            value="Moderate",
            severity="amber",
            basis=[
                f"{amber_count} area(s) require attention"
            ],
        )

    return DimensionResult(
        value="Good",
        severity="green",
        basis=[
            "Measured dimensions are within healthy ranges"
        ],
    )


@router.post(
    "/compute",
    response_model=HealthScoreResponse,
)
async def compute_health_score(
    req: HealthScoreRequest,
):

    try:

        vegetation = compute_vegetation_trend(
            req.latest_trend,
            req.active_anomalies,
        )

        water = compute_water_condition(
            req.weather,
            req.soil,
            req.latest_tile,
            req.crop_stage,
        )

        soil = compute_soil_condition(
            req.soil
        )

        weather = compute_weather_risk(
            req.weather,
            req.crop_stage,
        )

        disease = compute_disease_risk(
            req.weather,
            req.active_anomalies,
        )

        climate = compute_climate_stress(
            req.weather,
            req.active_anomalies,
        )

        crop_health = compute_crop_health([
            vegetation,
            water,
            soil,
            weather,
            disease,
            climate,
        ])

        return HealthScoreResponse(
            crop_health=crop_health,
            water_condition=water,
            soil_condition=soil,
            weather_risk=weather,
            disease_risk=disease,
            climate_stress=climate,
            vegetation_trend=vegetation,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Health score computation failed: {exc}",
        )
