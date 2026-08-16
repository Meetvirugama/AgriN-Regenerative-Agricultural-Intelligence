from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

router = APIRouter()

class HealthScoreRequest(BaseModel):
    field_id: str
    latest_tile: Optional[Any]
    latest_trend: Optional[Any]
    active_anomalies: List[Any]
    crop_stage: Any
    weather: Any
    soil: Any

class DimensionResult(BaseModel):
    value: str
    severity: str
    basis: List[str]

class HealthScoreResponse(BaseModel):
    crop_health: DimensionResult
    water_condition: DimensionResult
    soil_condition: DimensionResult
    weather_risk: DimensionResult
    disease_risk: DimensionResult
    climate_stress: DimensionResult
    vegetation_trend: DimensionResult

def compute_vegetation_trend(latest_trend: Any, active_anomalies: List[Any]) -> dict:
    basis = []
    severity = 'green'
    value = 'Stable'

    if active_anomalies:
        severity = 'red' if any(a.get('severity') == 'high' for a in active_anomalies) else 'amber'
        value = 'Decline detected'
        basis.append(f"Satellite anomaly detected in {len(active_anomalies)} sub-region(s)")
    elif latest_trend:
        direction = latest_trend.get('ndviTrendDirection')
        if direction == 'improving':
            value = 'Improving'
            basis.append('Field-wide NDVI is increasing compared to last pass')
        elif direction == 'declining':
            severity = 'amber'
            value = 'Slight decline'
            basis.append('Field-wide NDVI showed slight decline, monitoring closely')
        else:
            basis.append('Vegetation index is stable across the field')
    else:
        basis.append('No recent satellite data available to confirm trend')

    return {'value': value, 'severity': severity, 'basis': basis}

def compute_water_condition(weather: Any, soil: Any, tile: Any, stage: Any) -> dict:
    basis = []
    severity = 'green'
    value = 'Adequate'

    basis.append(f"Crop is in {stage.get('stage')} stage requiring {stage.get('waterNeed')} water")
    basis.append(f"Soil has {soil.get('waterHoldingCapacity')} water holding capacity")

    if weather.get('recentRainfallMm', 0) < 5 and weather.get('forecastRainfallMm', 0) == 0 and soil.get('waterHoldingCapacity') == 'low':
        severity = 'amber'
        value = 'Drying'
        basis.append('No recent or forecast rain on low-retention soil')
    
    if tile and tile.get('moistureProxy', 1.0) < 0.3:
        severity = 'red'
        value = 'Stressed'
        basis.append('Satellite surface moisture index is critically low')

    return {'value': value, 'severity': severity, 'basis': basis}

def compute_soil_condition(soil: Any) -> dict:
    return {
        'value': 'Moderate',
        'severity': 'amber' if soil.get('nitrogenLevel') == 'low' else 'green',
        'basis': [
            f"Texture is {soil.get('texture')}",
            f"Nitrogen levels are estimated at {soil.get('nitrogenLevel')}"
        ]
    }

def compute_weather_risk(weather: Any, stage: Any) -> dict:
    basis = []
    severity = 'green'
    value = 'Low Risk'
    
    active_flags = weather.get('activeFlags', [])
    if active_flags:
        severity = 'amber'
        value = 'Elevated Risk'
        basis.append(f"Active weather flags: {', '.join(active_flags)}")
    else:
        basis.append('No severe weather events forecast in next 7 days')

    if weather.get('forecastHighTemp', 0) > 33 and stage.get('stage') == 'Flowering':
        severity = 'red'
        value = 'High Risk'
        basis.append('Heat during flowering can severely impact yield')

    return {'value': value, 'severity': severity, 'basis': basis}

def compute_disease_risk(weather: Any, stage: Any, anomalies: List[Any]) -> dict:
    basis = []
    severity = 'green'
    value = 'Low Risk'

    if weather.get('humidityAvg', 0) > 80 and weather.get('recentRainfallMm', 0) > 10:
        severity = 'amber'
        value = 'Elevated Risk'
        basis.append('High humidity and recent rain create fungal conditions')
    else:
        basis.append('Current humidity and temperature do not favor major pathogens')

    if any(a.get('anomalyType') == 'vegetation_decline' for a in anomalies):
        basis.append('Existing vegetation decline could indicate active localized infection')

    return {'value': value, 'severity': severity, 'basis': basis}

def compute_climate_stress(weather: Any, anomalies: List[Any]) -> dict:
    return {
        'value': 'Normal',
        'severity': 'green',
        'basis': ['Temperatures are within normal seasonal range']
    }

def compute_crop_health(dimensions: List[dict]) -> dict:
    red_count = sum(1 for d in dimensions if d.get('severity') == 'red')
    amber_count = sum(1 for d in dimensions if d.get('severity') == 'amber')
    
    severity = 'green'
    value = 'Good'
    basis = []

    if red_count > 0:
        severity = 'red'
        value = 'Concern'
        basis.append(f"{red_count} critical stress factors identified")
    elif amber_count > 0:
        severity = 'amber'
        value = 'Moderate'
        basis.append(f"{amber_count} areas require attention")
    else:
        basis.append('All measured dimensions are within healthy ranges')

    return {'value': value, 'severity': severity, 'basis': basis}

@router.post("/compute", response_model=HealthScoreResponse)
async def compute_health_score(req: HealthScoreRequest):
    try:
        veg_trend = compute_vegetation_trend(req.latest_trend, req.active_anomalies)
        water_cond = compute_water_condition(req.weather, req.soil, req.latest_tile, req.crop_stage)
        soil_cond = compute_soil_condition(req.soil)
        weather_risk = compute_weather_risk(req.weather, req.crop_stage)
        disease_risk = compute_disease_risk(req.weather, req.crop_stage, req.active_anomalies)
        climate_stress = compute_climate_stress(req.weather, req.active_anomalies)
        
        crop_health = compute_crop_health([
            veg_trend, water_cond, soil_cond, weather_risk, disease_risk, climate_stress
        ])

        return HealthScoreResponse(
            crop_health=crop_health,
            water_condition=water_cond,
            soil_condition=soil_cond,
            weather_risk=weather_risk,
            disease_risk=disease_risk,
            climate_stress=climate_stress,
            vegetation_trend=veg_trend
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
